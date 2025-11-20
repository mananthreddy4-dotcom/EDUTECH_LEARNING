const Task = require('../models/Task');
const User = require('../models/User');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

/**
 * @route   GET /api/tasks
 * @desc    Get tasks based on user role
 *          - Students: their own personal tasks + tasks assigned to them by teacher
 *          - Teachers: tasks created by them + personal tasks of assigned students
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const { _id: userId, role } = req.user;
    let tasks;
if (role === 'student') {
  tasks = await Task.find({
    $or: [
      { userId: userId, taskType: 'personal' },
      { assignedTo: userId, taskType: 'assignment' }
    ]
  })
  .populate('userId', 'email role')
  .populate('submissions.studentId', 'email') // Add this
  .sort({ createdAt: -1 });

} else if (role === 'teacher') {
  const assignedStudents = await User.find({ 
    teacherId: userId,
    role: 'student'
  }).select('_id');

  const studentIds = assignedStudents.map(student => student._id);

  tasks = await Task.find({
    $or: [
      { userId: userId },
      { userId: { $in: studentIds }, taskType: 'personal' }
    ]
  })
  .populate('userId', 'email role')
  .populate('assignedTo', 'email')
  .populate('submissions.studentId', 'email') // Add this
  .sort({ createdAt: -1 });
}

    res.json({
      success: true,
      count: tasks.length,
      data: tasks // FIXED: changed from 'tasks' to 'data'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 *          - Students: can only create personal tasks for themselves
 *          - Teachers: can create personal tasks OR assignments for all students
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, progress, taskType, assignToAllStudents, acceptsSubmissions } = req.body;
    const { _id: userId, role } = req.user;

    let taskData = {
      userId,
      title,
      description,
      dueDate,
      progress: progress || 'not-started',
      taskType: taskType || 'personal',
      acceptsSubmissions: acceptsSubmissions || false
    };

    // If teacher creates an assignment for all students
    if (role === 'teacher' && taskType === 'assignment' && assignToAllStudents) {
      const assignedStudents = await User.find({ 
        teacherId: userId,
        role: 'student'
      }).select('_id');

      taskData.assignedTo = assignedStudents.map(s => s._id);
    }

    // Students can only create personal tasks
    if (role === 'student') {
      taskData.taskType = 'personal';
      taskData.assignedTo = [];
      taskData.acceptsSubmissions = false;
    }

    const task = await Task.create(taskData);
    const populatedTask = await Task.findById(task._id)
      .populate('userId', 'email role')
      .populate('assignedTo', 'email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask // FIXED: changed from 'task' to 'data'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task (only by owner)
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { _id: userId } = req.user;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization: Only the task owner can update
    if (task.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this task'
      });
    }

    // Update fields
    const { title, description, dueDate, progress } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (progress !== undefined) task.progress = progress;

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('userId', 'email role')
      .populate('assignedTo', 'email');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask // FIXED: changed from 'task' to 'data'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task (only by owner)
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { _id: userId } = req.user;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization: Only the task owner can delete
    if (task.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this task'
      });
    }

    // TODO: Delete all submission files from storage before deleting task
    // For now, just delete the task document

    await Task.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tasks/:id/submit
 * @desc    Submit a file for a task (students only)
 * @access  Private
 */
const submitTask = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const { _id: userId, role } = req.user;

    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit assignments'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if student is assigned to this task
    const isAssigned = task.assignedTo.some(id => id.toString() === userId.toString());
    
    if (!isAssigned && task.taskType === 'assignment') {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this task'
      });
    }

    if (!task.acceptsSubmissions) {
      return res.status(400).json({
        success: false,
        message: 'This task does not accept submissions'
      });
    }

    // Remove previous submission by this student if exists
    task.submissions = task.submissions.filter(
      sub => sub.studentId.toString() !== userId.toString()
    );

    // Add new submission
    task.submissions.push({
      studentId: userId,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      needsImprovement: false,
      improvementNote: ''
    });

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('userId', 'email role')
      .populate('submissions.studentId', 'email');

    res.json({
      success: true,
      message: 'Submission uploaded successfully',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/tasks/:taskId/submissions/:submissionId/improvement
 * @desc    Mark submission as needs improvement (teachers only)
 * @access  Private
 */
const markNeedsImprovement = async (req, res, next) => {
  try {
    const { taskId, submissionId } = req.params;
    const { improvementNote } = req.body;
    const { _id: userId, role } = req.user;

    if (role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can mark submissions'
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify teacher owns this task
    if (task.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only review submissions for your own assignments'
      });
    }

    const submission = task.submissions.id(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    submission.needsImprovement = true;
    submission.improvementNote = improvementNote || 'Please review and resubmit';

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('userId', 'email role')
      .populate('submissions.studentId', 'email');

    res.json({
      success: true,
      message: 'Marked as needs improvement',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/tasks/:taskId/submissions/:submissionId
 * @desc    Delete a submission
 * @access  Private
 */
const deleteSubmission = async (req, res, next) => {
  try {
    const { taskId, submissionId } = req.params;
    const { _id: userId, role } = req.user;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const submission = task.submissions.id(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Students can delete their own submissions, teachers can delete any
    const isOwner = submission.studentId.toString() === userId.toString();
    const isTeacherOwner = role === 'teacher' && task.userId.toString() === userId.toString();

    if (!isOwner && !isTeacherOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this submission'
      });
    }

    // TODO: Delete file from storage
    // fs.unlinkSync(path.join(__dirname, '..', submission.fileUrl));

    task.submissions.pull(submissionId);
    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('userId', 'email role')
      .populate('submissions.studentId', 'email');

    res.json({
      success: true,
      message: 'Submission deleted successfully',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tasks/:id/submissions/download
 * @desc    Download all submissions as ZIP (teachers only)
 * @access  Private
 */
const downloadAllSubmissions = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const { _id: userId, role } = req.user;

    if (role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can download submissions'
      });
    }

    const task = await Task.findById(taskId)
      .populate('submissions.studentId', 'email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only download submissions for your own assignments'
      });
    }

    if (task.submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No submissions found'
      });
    }

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.attachment(`${task.title.replace(/[^a-z0-9]/gi, '_')}_submissions.zip`);
    archive.pipe(res);

    // Add each submission to archive
    for (const submission of task.submissions) {
      const filePath = path.join(__dirname, '..', submission.fileUrl);
      if (fs.existsSync(filePath)) {
        const studentEmail = submission.studentId.email.split('@')[0];
        archive.file(filePath, { name: `${studentEmail}_${submission.fileName}` });
      }
    }

    archive.finalize();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  submitTask,
  markNeedsImprovement,
  deleteSubmission,
  downloadAllSubmissions
};
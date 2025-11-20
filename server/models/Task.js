const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  needsImprovement: {
    type: Boolean,
    default: false
  },
  improvementNote: {
    type: String,
    default: ''
  }
});

const taskSchema = new mongoose.Schema({
  // The user (student or teacher) who created this task
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  dueDate: {
    type: Date,
    default: null
  },
  progress: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  // NEW: Task type - differentiates between personal tasks and teacher-assigned tasks
  taskType: {
    type: String,
    enum: ['personal', 'assignment'],
    default: 'personal'
  },
  // NEW: For teacher assignments - which students this task is assigned to
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // NEW: Submissions from students
  submissions: [submissionSchema],
  // NEW: Track if this is an assignment that accepts submissions
  acceptsSubmissions: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
taskSchema.index({ userId: 1 });
taskSchema.index({ progress: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ taskType: 1 });

module.exports = mongoose.model('Task', taskSchema);
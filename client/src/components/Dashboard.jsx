import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Plus, Trash2, LogOut, Filter, X, Download } from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [progressFilter, setProgressFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingTaskId, setUploadingTaskId] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    progress: 'not-started',
    taskType: 'personal',
    assignToAllStudents: false,
    acceptsSubmissions: false
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, progressFilter]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.data || []);
      } else {
        setError(data.message);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch tasks');
      setLoading(false);
    }
  };

  const filterTasks = () => {
    if (progressFilter === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.progress === progressFilter));
    }
  };

  const handleCreateTask = async () => {
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskForm)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Task created successfully!');
        fetchTasks();
        setTaskForm({
          title: '',
          description: '',
          dueDate: '',
          progress: 'not-started',
          taskType: 'personal',
          assignToAllStudents: false,
          acceptsSubmissions: false
        });
        setShowTaskForm(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to create task');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFileSelect = (e, taskId) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSelectedFile({ file, taskId });
  };

  const handleSubmitTask = async (taskId) => {
    if (!selectedFile || selectedFile.taskId !== taskId) {
      setError('Please select a file to submit');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploadingTaskId(taskId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile.file);

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Submission uploaded successfully!');
        fetchTasks();
        setSelectedFile(null);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to submit task');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleMarkNeedsImprovement = async (taskId, submissionId) => {
    const note = prompt('Enter feedback for the student:');
    if (!note) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/tasks/${taskId}/submissions/${submissionId}/improvement`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ improvementNote: note })
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('Marked as needs improvement');
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to mark submission');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteSubmission = async (taskId, submissionId) => {
    if (!window.confirm('Delete this submission?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/tasks/${taskId}/submissions/${submissionId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('Submission deleted');
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete submission');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDownloadAllSubmissions = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/tasks/${taskId}/submissions/download`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'submissions.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setSuccess('Downloaded submissions');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to download submissions');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateProgress = async (taskId, newProgress) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress: newProgress })
      });

      const data = await response.json();

      if (data.success) {
        fetchTasks();
      } else {
        setError(data.message);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to update task');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task? All submissions will be lost.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Task deleted');
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete task');
      setTimeout(() => setError(''), 3000);
    }
  };

  const isTaskOwner = (task) => {
    return task.userId._id === user.id;
  };

  const getMySubmission = (task) => {
    return task.submissions?.find(sub => sub.studentId._id === user.id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate, progress) => {
    if (!dueDate || progress === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const statusStyles = {
    'not-started': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'in-progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    'completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  };

  const statusIcons = {
    'not-started': Clock,
    'in-progress': AlertCircle,
    'completed': CheckCircle
  };

  const Toast = ({ type, message }) => {
    const styles = {
      success: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
      error: 'bg-red-500/10 border-red-500/50 text-red-400'
    };
    
    return (
      <div className={`fixed top-4 right-4 px-6 py-4 rounded-2xl border backdrop-blur-xl ${styles[type]} shadow-2xl z-50`}>
        <div className="flex items-center gap-3">
          {type === 'success' && <CheckCircle className="w-5 h-5" />}
          {type === 'error' && <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-50">TaskManager</h1>
                <p className="text-xs text-slate-400 capitalize">{user.role} Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-200">{user.email}</p>
                <p className="text-xs text-slate-400">ID: {user.id.slice(0, 12)}...</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center font-semibold text-white shadow-lg">
                {user.email[0].toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-2 border border-white/10 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {error && <Toast type="error" message={error} />}
      {success && <Toast type="success" message={success} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-50 mb-1">
              {user.role === 'teacher' ? 'My Tasks & Student Tasks' : 'My Tasks'}
            </h2>
            <p className="text-slate-400 text-sm">Showing {filteredTasks.length} of {tasks.length} tasks</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
              >
                <option value="all">All Tasks</option>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 focus:ring-2 focus:ring-violet-500 focus:outline-none whitespace-nowrap"
            >
              {showTaskForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showTaskForm ? 'Cancel' : 'New Task'}
            </button>
          </div>
        </div>

        {/* Create Task Form */}
        {showTaskForm && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Description *</label>
                <textarea
                  rows="4"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                  placeholder="Describe the task"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Initial Status</label>
                  <select
                    value={taskForm.progress}
                    onChange={(e) => setTaskForm({ ...taskForm, progress: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {user.role === 'teacher' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Task Type</label>
                    <select
                      value={taskForm.taskType}
                      onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="personal">Personal Task</option>
                      <option value="assignment">Assignment for Students</option>
                    </select>
                  </div>

                  {taskForm.taskType === 'assignment' && (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskForm.assignToAllStudents}
                          onChange={(e) => setTaskForm({ ...taskForm, assignToAllStudents: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Assign to all my students</span>
                      </label>

                      <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskForm.acceptsSubmissions}
                          onChange={(e) => setTaskForm({ ...taskForm, acceptsSubmissions: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Accept file submissions</span>
                      </label>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handleCreateTask}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              >
                Create Task
              </button>
            </div>
          </div>
        )}

        {/* Task Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No tasks found</h3>
            <p className="text-slate-400 mb-6">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              const mySubmission = user.role === 'student' ? getMySubmission(task) : null;
              const isAssignment = task.taskType === 'assignment';
              const isOwner = isTaskOwner(task);
              const StatusIcon = statusIcons[task.progress] || Clock;

              return (
                <div key={task._id} className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:border-violet-500/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium border ${statusStyles[task.progress]}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {task.progress.replace('-', ' ')}
                    </span>
                    
                    {isAssignment && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/30">
                        Assignment
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-slate-50 mb-2 leading-relaxed">{task.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{task.description}</p>
                  
                  {/* Show creator info for teachers */}
                  {user.role === 'teacher' && !isOwner && (
                    <div className="mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-300">
                        👤 Created by: <span className="font-semibold">{task.userId.email}</span>
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span className={isOverdue(task.dueDate, task.progress) ? 'text-red-400 font-semibold' : ''}>
                      📅 {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate, task.progress) && ' (Overdue)'}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mb-4">
                    <select
                      value={task.progress}
                      onChange={(e) => handleUpdateProgress(task._id, e.target.value)}
                      disabled={!isOwner}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {user.role === 'student' && isAssignment && task.acceptsSubmissions && (
                    <div className="pt-4 border-t border-white/10">
                      <h5 className="text-sm font-semibold text-slate-200 mb-3">Your Submission</h5>
                      {mySubmission ? (
                        <div className="space-y-2">
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <p className="text-xs text-emerald-400 font-medium">✅ Submitted</p>
                            <p className="text-xs text-slate-300 mt-1">{mySubmission.fileName}</p>
                            <p className="text-xs text-slate-400">{formatFileSize(mySubmission.fileSize)}</p>
                          </div>
                          {mySubmission.needsImprovement && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                              <p className="text-xs text-amber-400 font-medium">⚠️ Needs Improvement</p>
                              <p className="text-xs text-slate-300 mt-1">{mySubmission.improvementNote}</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteSubmission(task._id, mySubmission._id)}
                            className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/30 transition-all"
                          >
                            Delete Submission
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="file"
                            onChange={(e) => handleFileSelect(e, task._id)}
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt,.zip"
                            className="w-full text-xs text-slate-400 file:mr-2 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-violet-500/20 file:text-violet-300 hover:file:bg-violet-500/30 file:cursor-pointer"
                          />
                          {selectedFile && selectedFile.taskId === task._id && (
                            <button
                              onClick={() => handleSubmitTask(task._id)}
                              disabled={uploadingTaskId === task._id}
                              className="w-full px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                              {uploadingTaskId === task._id ? 'Uploading...' : 'Submit File'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {user.role === 'teacher' && isOwner && isAssignment && task.acceptsSubmissions && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-slate-200">
                          Submissions ({task.submissions?.length || 0})
                        </h5>
                        {task.submissions && task.submissions.length > 0 && (
                          <button
                            onClick={() => handleDownloadAllSubmissions(task._id)}
                            className="p-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {task.submissions && task.submissions.length > 0 ? (
                        <div className="space-y-2">
                          {task.submissions.map((sub) => (
                            <div key={sub._id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                              <p className="text-xs font-medium text-slate-200">{sub.studentId.email}</p>
                              <p className="text-xs text-slate-400 mt-1">{sub.fileName} ({formatFileSize(sub.fileSize)})</p>
                              {sub.needsImprovement && (
                                <p className="text-xs text-amber-400 mt-1">⚠️ {sub.improvementNote}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleMarkNeedsImprovement(task._id, sub._id)}
                                  className="flex-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded border border-amber-500/30 transition-all"
                                >
                                  Need Work
                                </button>
                                <button
                                  onClick={() => handleDeleteSubmission(task._id, sub._id)}
                                  className="flex-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded border border-red-500/30 transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No submissions yet</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, createTaskSchema, updateTaskSchema } = require('../utils/validators');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  submitTask,
  markNeedsImprovement,
  deleteSubmission,
  downloadAllSubmissions
} = require('../controllers/taskController');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created from taskRoutes');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images, PDFs, documents, and ZIP files are allowed'));
  }
});

// All task routes require authentication
router.use(authenticate);

// Task CRUD routes
router.get('/', getTasks);
router.post('/', validate(createTaskSchema), createTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

// Submission routes
router.post('/:id/submit', upload.single('file'), submitTask);
router.put('/:taskId/submissions/:submissionId/improvement', markNeedsImprovement);
router.delete('/:taskId/submissions/:submissionId', deleteSubmission);
router.get('/:id/submissions/download', downloadAllSubmissions);

module.exports = router;
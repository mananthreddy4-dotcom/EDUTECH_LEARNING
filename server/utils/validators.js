const Joi = require('joi');

// Task schemas (existing)
const createTaskSchema = Joi.object({
  title: Joi.string().required().max(200).trim(),
  description: Joi.string().allow('').max(1000).trim(),
  dueDate: Joi.date().allow(null, ''),
  progress: Joi.string().valid('not-started', 'in-progress', 'completed'),
  taskType: Joi.string().valid('personal', 'assignment').default('personal'),
  assignToAllStudents: Joi.boolean().default(false),
  acceptsSubmissions: Joi.boolean().default(false)
});

const updateTaskSchema = Joi.object({
  title: Joi.string().max(200).trim(),
  description: Joi.string().allow('').max(1000).trim(),
  dueDate: Joi.date().allow(null, ''),
  progress: Joi.string().valid('not-started', 'in-progress', 'completed')
});

// Auth schemas (NEW)
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'teacher').required(),
  teacherId: Joi.string().when('role', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  createTaskSchema,
  updateTaskSchema,
  signupSchema,
  loginSchema
};
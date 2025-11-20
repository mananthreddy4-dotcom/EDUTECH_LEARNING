const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, login } = require('../controllers/authController');
const { validate, signupSchema, loginSchema } = require('../utils/validators');

const router = express.Router();

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/auth/signup
router.post('/signup', validate(signupSchema), signup);

// @route   POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), login);

module.exports = router;
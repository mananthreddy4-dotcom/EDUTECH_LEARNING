const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token
 */
const generateToken = (userId, role) => {
  console.log('Generating token for userId:', userId, 'role:', role);
  
  if (!userId) {
    throw new Error('userId is required for token generation');
  }
  if (!role) {
    throw new Error('role is required for token generation');
  }
  
  return jwt.sign(
    { userId: userId.toString(), role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const { email, password, role, teacherId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // If role is student, verify teacher exists
    if (role === 'student') {
      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: 'Teacher ID is required for students'
        });
      }
      
      const teacher = await User.findById(teacherId);
      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: 'Teacher not found with provided ID'
        });
      }
      if (teacher.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'Provided ID is not a teacher'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      role,
      teacherId: role === 'student' ? teacherId : undefined
    });

    // Generate token
    const token = generateToken(user._id, user.role);
    
    console.log('Signup successful, token generated:', token ? 'YES' : 'NO');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    console.log('Login attempt for:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).populate('teacherId', 'email');
    console.log('User found:', user ? 'YES' : 'NO');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token with BOTH userId and role
    console.log('Generating token for user:', user._id, 'role:', user.role);
    const token = generateToken(user._id, user.role);
    console.log('Token generated successfully:', token ? 'YES' : 'NO');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId?._id,
        teacherEmail: user.teacherId?.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

module.exports = { signup, login };
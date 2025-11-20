const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    console.log('UserId from token:', decoded.userId);
    console.log('Type of userId:', typeof decoded.userId);

    const userId = decoded.userId;

    if (!userId) {
      console.log('ERROR: No userId in token');
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.'
      });
    }

    console.log('Searching for user with ID:', userId);
    const user = await User.findById(userId).select('-passwordHash');
    console.log('User found:', user);

    if (!user) {
      console.log('ERROR: User not found in database for ID:', userId);
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Attach user to request
    req.user = {
      _id: user._id,
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      teacherId: user.teacherId
    };

    console.log('Successfully authenticated user:', req.user);
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

module.exports = { authenticate };
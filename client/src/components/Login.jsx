import { useState } from 'react';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    teacherId: ''
  });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      
      // For signup, only send teacherId if role is student
      let body;
      if (isSignup) {
        body = {
          email: formData.email,
          password: formData.password,
          role: formData.role
        };
        
        // Only include teacherId for students
        if (formData.role === 'student') {
          if (!formData.teacherId) {
            setError('Please enter your teacher ID');
            setLoading(false);
            return;
          }
          body.teacherId = formData.teacherId;
        }
      } else {
        // For login, only send email and password
        body = { 
          email: formData.email, 
          password: formData.password 
        };
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.success) {
        localStorage.setItem('token', data.token);
        console.log('Token stored:', data.token);
        onLogin(data.user);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const Spinner = () => (
    <div className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-2xl mb-4">
            {isSignup ? (
              <UserPlus className="w-9 h-9 text-white" />
            ) : (
              <LogIn className="w-9 h-9 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight mb-2">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 leading-relaxed">
            {isSignup ? 'Join to start managing tasks' : 'Sign in to manage your tasks'}
          </p>
        </div>
        
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                placeholder="teacher@school.edu"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                required
              />
              {isSignup && (
                <p className="mt-1 text-xs text-slate-400">Minimum 6 characters</p>
              )}
            </div>

            {/* Signup-only Fields */}
            {isSignup && (
              <>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-200 mb-2">
                    I am a
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>

                {formData.role === 'student' && (
                  <div>
                    <label htmlFor="teacherId" className="block text-sm font-medium text-slate-200 mb-2">
                      Teacher ID *
                    </label>
                    <input
                      id="teacherId"
                      type="text"
                      name="teacherId"
                      value={formData.teacherId}
                      onChange={handleChange}
                      placeholder="Enter your teacher's ID"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Get this from your teacher's dashboard
                    </p>
                  </div>
                )}
              </>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-violet-500 focus:outline-none"
            >
              {loading ? (
                <Spinner />
              ) : isSignup ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
          
          {/* Footer Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  role: 'student',
                  teacherId: ''
                });
              }}
              className="text-sm text-slate-400 hover:text-violet-400 transition-colors focus:outline-none focus:underline"
            >
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span className="font-semibold">{isSignup ? 'Sign in' : 'Sign up'}</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default Login;
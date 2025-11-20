import { useState, useEffect } from 'react';
import { apiFetch, API_BASE_URL } from "../config/api";

function Signup({ onSwitchToLogin, onSignupSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    teacherId: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch list of teachers when component mounts
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/teachers`);
      const data = await response.json();
      if (data.success) {
        setTeachers(data.teachers);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Prepare data based on role
    const signupData = {
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    // Include teacherId for students (REQUIRED)
    if (formData.role === 'student') {
      if (!formData.teacherId) {
        setError('Please select a teacher');
        setLoading(false);
        return;
      }
      signupData.teacherId = formData.teacherId;
    }

    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData)
      });

      if (data.success && data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSignupSuccess(data.user);
      } else {
        setError(data.message || 'Signup failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err.message || `Network error. Please check if the server is running at ${API_BASE_URL}.`;
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Sign Up</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
            <small style={{color: '#666', fontSize: '12px'}}>Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="role">I am a: *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <div className="form-group">
              <label htmlFor="teacherId">Teacher ID * (Required)</label>
              <select
                id="teacherId"
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                required
              >
                <option value="">-- Select a Teacher --</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.email} (ID: {teacher._id})
                  </option>
                ))}
              </select>
              <small style={{color: '#666', fontSize: '12px'}}>
                Copy the Teacher ID from your teacher's dashboard
              </small>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div className="switch-auth">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin}>Login here</button>
        </div>
      </div>
    </div>
  );
}

export default Signup;
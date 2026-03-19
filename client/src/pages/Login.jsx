import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const endpoint = isSignup ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;
    const body = isSignup
      ? { name: form.name, email: form.email, password: form.password }
      : { email: form.email, password: form.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 transition-all duration-300">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 overflow-hidden shadow-lg transition-colors duration-500 ${isSignup ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
            <img src="/logo.png" alt="TutorFlow Logo" className="w-[60%] h-[60%] object-contain" />
          </div>
          <h1 className="text-2xl font-bold">TutorFlow</h1>
          <p className="text-text-secondary text-sm mt-1">Fee Management System</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold mb-1">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            {isSignup ? 'Get started with TutorFlow' : 'Sign in to your account'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-danger-light text-danger text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Vikram Sharma"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
            )}
            <div>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  className="form-input pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full justify-center py-3 text-base font-semibold rounded-xl text-white shadow-md transition-all duration-300 ${
                isSignup 
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:-translate-y-0.5' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg hover:-translate-y-0.5'
              }`}
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                isSignup ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-text-secondary text-sm mt-6">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              className="text-accent hover:text-accent-hover font-medium transition-colors"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

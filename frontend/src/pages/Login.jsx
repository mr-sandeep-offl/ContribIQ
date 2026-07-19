import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md animate-scaleIn">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card-lg p-8">
          {/* Brand */}
          <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 shadow-sm">
              <Zap className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SyncScore <span className="gradient-text">AI</span>
            </span>
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome back</h1>
            <p className="text-sm text-slate-500">Enter your credentials to access your workspace</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            <Input
              label="Email Address"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
            
            <div className="flex flex-col gap-1.5 w-full text-left">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2 py-2.5 text-sm"
            >
              <Lock size={14} className="mr-1.5" />
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Sign up free
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          &copy; {new Date().getFullYear()} SyncScore AI
        </p>
      </div>
    </div>
  );
};

export default Login;

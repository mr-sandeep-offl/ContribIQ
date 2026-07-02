import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, AlertCircle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <Cpu className="text-indigo-500 h-7 w-7" />
          <span className="text-2xl font-bold tracking-tight text-white">
            SyncScore <span className="text-indigo-400">AI</span>
          </span>
        </Link>
        
        <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your credentials to access your projects</p>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-450 text-xs text-left">
            <AlertCircle size={14} className="shrink-0 text-rose-400" />
            <span className="text-rose-400">{error}</span>
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

          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button 
            type="submit" 
            variant="primary" 
            loading={loading}
            className="w-full mt-2 py-2.5"
          >
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-350 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

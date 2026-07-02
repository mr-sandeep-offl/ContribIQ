import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, AlertCircle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [githubUsername, setGithubUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password, role, githubUsername });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register account');
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
        
        <h2 className="text-xl font-bold text-white mb-1">Create an account</h2>
        <p className="text-sm text-gray-500 mb-6">Join your team and track your contributions</p>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs text-left">
            <AlertCircle size={14} className="shrink-0 text-rose-450" />
            <span className="text-rose-450 text-rose-450">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <Input
            label="Full Name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />

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
            label="Password (min 6 characters)"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="role" className="text-sm font-medium text-gray-300">
              Account Role <span className="text-rose-500">*</span>
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="student">Student</option>
              <option value="team_leader">Team Leader</option>
              <option value="professor">Professor</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <Input
            label="GitHub Username (for commit tracking)"
            id="githubUsername"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="octocat"
          />

          <Button 
            type="submit" 
            variant="primary" 
            loading={loading}
            className="w-full mt-2 py-2.5"
          >
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-350 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

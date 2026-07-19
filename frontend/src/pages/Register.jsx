import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, AlertCircle, UserPlus } from 'lucide-react';
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

  const selectCls =
    'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all';

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
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Create an account</h1>
            <p className="text-sm text-slate-500">Join your team and start tracking contributions</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="text-sm font-semibold text-slate-700">
                Account Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={selectCls}
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
              className="w-full mt-2 py-2.5 text-sm"
            >
              <UserPlus size={14} className="mr-1.5" />
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Sign in
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

export default Register;

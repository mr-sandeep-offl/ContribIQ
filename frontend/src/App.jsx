import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import MyTasks from './pages/MyTasks';
import AIChat from './pages/AIChat';
import Placeholder from './pages/Placeholder';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            
            {/* New Global Routes */}
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/kanban" element={<Placeholder title="Global Kanban Board" description="View all tasks across all projects grouped by status." />} />
            <Route path="/timeline" element={<Placeholder title="Global Timeline" description="View aggregate contributions and activity across all your projects." />} />
            <Route path="/ai-assistant" element={<AIChat />} />
            <Route path="/analytics" element={<Placeholder title="Cross-Project Analytics" description="View aggregated analytics and team health." />} />
            <Route path="/reports" element={<Placeholder title="Global Reports" description="Generate wide-scale reports for all your ongoing work." />} />
            <Route path="/github" element={<Placeholder title="Integrations: GitHub" description="Manage global GitHub connections and default sync settings." />} />
            <Route path="/calendar" element={<Placeholder title="Calendar" description="View all upcoming project deadlines and task due dates." />} />
            <Route path="/notifications" element={<Placeholder title="Notifications" description="View your recent alerts, mentions, and updates." />} />
            <Route path="/profile" element={<Placeholder title="My Profile" description="Manage your personal details, GitHub username, and global preferences." />} />
            <Route path="/settings" element={<Placeholder title="Settings" theme="Account preferences, security, and UI settings." />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { getProjects, createProject } from '../api/projectApi';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import ProjectCard from '../components/projects/ProjectCard';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { Plus, AlertCircle, FolderOpen } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('college');
  const [deadline, setDeadline] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      setError('Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    try {
      await createProject({ title, description, category, deadline, repoUrl, status: 'planning' });
      setTitle(''); setDescription(''); setCategory('college');
      setDeadline(''); setRepoUrl('');
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreateLoading(false);
    }
  };

  const selectCls =
    'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all';

  // Skeleton card
  const CardSkeleton = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card min-h-[200px] flex flex-col justify-between">
      <div>
        <div className="flex justify-between mb-3">
          <div className="skeleton h-4 w-36 rounded" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="skeleton h-3 w-full rounded mt-2 mb-1" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
      <div className="pt-4 border-t border-slate-100 flex gap-3">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto w-full text-left page-enter">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Projects Workspace
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                View, manage, and launch new project workspaces.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus size={16} />
              Create Project
            </Button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects here"
              description="Create your first team project workspace to manage tasks, contributions, and telemetry."
              actionText="Create Project"
              onAction={() => setModalOpen(true)}
              icon={FolderOpen}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}

          {/* Create Project Modal */}
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Project">
            <form onSubmit={handleCreateProject} className="flex flex-col gap-4 text-left">
              <Input
                label="Project Title"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., SyncScore AI Backend"
                required
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the project objectives..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="category" className="text-sm font-semibold text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={selectCls}
                  >
                    <option value="college">College Project</option>
                    <option value="corporate">Corporate Sprint</option>
                    <option value="personal">Personal Project</option>
                  </select>
                </div>

                <Input
                  label="Deadline"
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <Input
                label="GitHub Repository URL (Optional)"
                id="repoUrl"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
              />

              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={createLoading}>
                  Create Workspace
                </Button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
};

export default Projects;

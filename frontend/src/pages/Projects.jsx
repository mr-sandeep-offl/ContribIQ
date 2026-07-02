import React, { useState, useEffect } from 'react';
import { getProjects, createProject } from '../api/projectApi';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import ProjectCard from '../components/projects/ProjectCard';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { Plus } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
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
    } catch (err) {
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
      await createProject({
        title,
        description,
        category,
        deadline,
        repoUrl,
        status: 'planning',
      });
      // Clear form
      setTitle('');
      setDescription('');
      setCategory('college');
      setDeadline('');
      setRepoUrl('');
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full text-left">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Projects Workspace</h1>
              <p className="text-sm text-gray-400">View and launch new projects.</p>
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
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects here"
              description="Create your first team project workspace to manage tasks and telemetry."
              actionText="Create Project"
              onAction={() => setModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}

          {/* Create Project Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Create New Project"
          >
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
                <label htmlFor="description" className="text-sm font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the project objectives..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white placeholder-gray-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="category" className="text-sm font-medium text-gray-300">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

              <div className="flex justify-end gap-3 mt-4 border-t border-gray-800 pt-4">
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

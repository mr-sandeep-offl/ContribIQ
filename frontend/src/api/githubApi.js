import axiosInstance from './axiosInstance';

/**
 * Get GitHub integration status for a project.
 * Returns: { connected, validUrl, repoUrl, normalizedUrl, owner, repo, lastImportedAt }
 */
export const getGitHubStatus = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/github/status`);
  return response.data;
};

/**
 * Get repository metadata from GitHub API (via backend).
 */
export const getRepository = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/github/repository`);
  return response.data;
};

/**
 * Get latest commits from GitHub (via backend).
 */
export const getCommits = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/github/commits`);
  return response.data;
};

/**
 * Get contributors from GitHub (via backend).
 */
export const getContributors = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/github/contributors`);
  return response.data;
};

/**
 * Get branches from GitHub (via backend).
 */
export const getBranches = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/github/branches`);
  return response.data;
};

/**
 * Get pull requests from GitHub (via backend).
 */
export const getPullRequests = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/github/pull-requests`);
  return response.data;
};

/**
 * Get issues from GitHub (excludes PRs, via backend).
 */
export const getIssues = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/github/issues`);
  return response.data;
};

/**
 * Sync real GitHub commits as contributions.
 * Deduplicates by SHA — safe to call multiple times.
 */
export const syncGitHub = async (projectId) => {
  const response = await axiosInstance.post(`/projects/${projectId}/github/sync`);
  return response.data;
};

/**
 * @deprecated Use syncGitHub instead.
 */
export const importMockContributions = async (projectId) => {
  const response = await axiosInstance.post(`/projects/${projectId}/github/import`);
  return response.data;
};

/**
 * @deprecated Repo info is now fetched via backend (/github/repository).
 * This frontend-direct call is no longer used.
 */
export const fetchRepoInfo = async (owner, repo) => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  return response.json();
};

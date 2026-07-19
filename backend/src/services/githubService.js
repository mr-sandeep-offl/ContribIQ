/**
 * githubService.js
 * Real GitHub REST API client.
 * Uses GITHUB_TOKEN from environment if available (keeps rate limit high).
 * Never exposes the token to the frontend.
 */

const https = require('https');

/**
 * Build common headers for GitHub API requests.
 */
const buildHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'SyncScore-AI/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

/**
 * Generic GitHub REST API GET request.
 * @param {string} path - e.g. '/repos/owner/repo'
 * @param {object} queryParams - optional key-value query string params
 * @returns {Promise<object>}
 */
const githubGet = (path, queryParams = {}) => {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams(queryParams).toString();
    const fullPath = qs ? `${path}?${qs}` : path;

    const options = {
      hostname: 'api.github.com',
      path: fullPath,
      method: 'GET',
      headers: buildHeaders(),
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 404) {
          return reject(new Error('GitHub repository not found or is private'));
        }
        if (res.statusCode === 403 || res.statusCode === 429) {
          return reject(new Error('GitHub API rate limit exceeded. Please set GITHUB_TOKEN in backend .env'));
        }
        if (res.statusCode >= 400) {
          let msg = `GitHub API error ${res.statusCode}`;
          try { msg = JSON.parse(data).message || msg; } catch {}
          return reject(new Error(msg));
        }
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Failed to parse GitHub API response'));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy(new Error('GitHub API request timed out'));
    });
    req.end();
  });
};

/**
 * Validate and parse a GitHub repository URL.
 * Accepts: https://github.com/owner/repo or https://github.com/owner/repo.git
 * Returns: { owner, repo, normalizedUrl } or throws.
 */
const parseRepoUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('No repository URL configured for this project');
  }

  const url = rawUrl.trim().replace(/\/$/, '').replace(/\.git$/, '');

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Repository URL is not a valid URL');
  }

  if (parsed.hostname !== 'github.com') {
    throw new Error('Repository URL must be a GitHub URL (github.com)');
  }

  const parts = parsed.pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new Error('Repository URL must include both owner and repository name');
  }

  const owner = parts[0];
  const repo = parts[1];

  return {
    owner,
    repo,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
  };
};

/**
 * Fetch repository metadata.
 */
const getRepository = async (owner, repo) => {
  return githubGet(`/repos/${owner}/${repo}`);
};

/**
 * Fetch latest commits (default: 20).
 */
const getCommits = async (owner, repo, perPage = 20) => {
  return githubGet(`/repos/${owner}/${repo}/commits`, { per_page: perPage });
};

/**
 * Fetch contributors.
 */
const getContributors = async (owner, repo, perPage = 20) => {
  return githubGet(`/repos/${owner}/${repo}/contributors`, { per_page: perPage });
};

/**
 * Fetch branches.
 */
const getBranches = async (owner, repo, perPage = 30) => {
  return githubGet(`/repos/${owner}/${repo}/branches`, { per_page: perPage });
};

/**
 * Fetch pull requests.
 * @param {string} state - 'open', 'closed', 'all'
 */
const getPullRequests = async (owner, repo, state = 'all', perPage = 30) => {
  return githubGet(`/repos/${owner}/${repo}/pulls`, { state, per_page: perPage });
};

/**
 * Fetch issues (excludes pull requests by filtering type).
 * GitHub issues endpoint includes PRs; we filter them out client-side.
 */
const getIssues = async (owner, repo, state = 'all', perPage = 30) => {
  const items = await githubGet(`/repos/${owner}/${repo}/issues`, {
    state,
    per_page: perPage,
  });
  // Filter out pull requests (they appear in issues API too)
  return items.filter((item) => !item.pull_request);
};

module.exports = {
  parseRepoUrl,
  getRepository,
  getCommits,
  getContributors,
  getBranches,
  getPullRequests,
  getIssues,
};

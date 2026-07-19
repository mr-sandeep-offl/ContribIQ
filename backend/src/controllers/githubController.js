const Project = require('../models/Project');
const Contribution = require('../models/Contribution');
const githubService = require('../services/githubService');

/**
 * Helper: verify the requesting user is a member of the project.
 * Returns { project } or calls next(error).
 */
const getAuthorizedProject = async (projectId, userId, res, next) => {
  const project = await Project.findById(projectId).populate('members.user');
  if (!project) {
    res.status(404);
    next(new Error('Project not found'));
    return null;
  }

  const isMember = project.members.some(
    (m) => m.user._id.toString() === userId.toString()
  );
  if (!isMember) {
    res.status(403);
    next(new Error('Not authorized to access this project'));
    return null;
  }

  return project;
};

/**
 * Helper: parse and validate repoUrl from project.
 * Returns { owner, repo, normalizedUrl } or calls next(error).
 */
const getRepoCoords = (project, res, next) => {
  try {
    return githubService.parseRepoUrl(project.repoUrl);
  } catch (err) {
    res.status(400);
    next(err);
    return null;
  }
};

// ──────────────────────────────────────────────────────────
// @desc    Get GitHub integration status for project
// @route   GET /api/projects/:projectId/github/status
// @access  Private
// ──────────────────────────────────────────────────────────
const getGitHubStatus = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await getAuthorizedProject(projectId, req.user._id, res, next);
    if (!project) return;

    const connected = !!project.repoUrl;
    let normalizedUrl = '';
    let owner = '';
    let repo = '';
    let validUrl = false;

    if (connected) {
      try {
        const parsed = githubService.parseRepoUrl(project.repoUrl);
        normalizedUrl = parsed.normalizedUrl;
        owner = parsed.owner;
        repo = parsed.repo;
        validUrl = true;
      } catch {
        validUrl = false;
      }
    }

    // Last imported contribution from GitHub source
    const lastContribution = await Contribution.findOne({
      projectId,
      source: 'github',
    }).sort({ createdAt: -1 });

    const lastImportedAt = lastContribution ? lastContribution.createdAt : null;

    res.json({
      connected,
      validUrl,
      repoUrl: project.repoUrl || '',
      normalizedUrl,
      owner,
      repo,
      lastImportedAt,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────
// @desc    Get repository metadata from GitHub
// @route   GET /api/projects/:projectId/github/repository
// @access  Private
// ──────────────────────────────────────────────────────────
const getRepository = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await getAuthorizedProject(projectId, req.user._id, res, next);
    if (!project) return;

    const coords = getRepoCoords(project, res, next);
    if (!coords) return;

    const data = await githubService.getRepository(coords.owner, coords.repo);

    res.json({
      name: data.name,
      fullName: data.full_name,
      owner: data.owner?.login,
      ownerAvatar: data.owner?.avatar_url,
      description: data.description || null,
      private: data.private,
      defaultBranch: data.default_branch,
      language: data.language || null,
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.watchers_count,
      openIssues: data.open_issues_count,
      htmlUrl: data.html_url,
      pushedAt: data.pushed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      normalizedUrl: coords.normalizedUrl,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────
// @desc    Get latest commits from GitHub
// @route   GET /api/projects/:projectId/github/commits
// @access  Private
// ──────────────────────────────────────────────────────────
const getCommits = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await getAuthorizedProject(projectId, req.user._id, res, next);
    if (!project) return;

    const coords = getRepoCoords(project, res, next);
    if (!coords) return;

    const raw = await githubService.getCommits(coords.owner, coords.repo, 20);

    const commits = raw.map((c) => ({
      sha: c.sha,
      shortSha: c.sha?.substring(0, 7),
      message: c.commit?.message?.split('\n')[0] || '',
      author: c.commit?.author?.name || c.author?.login || 'Unknown',
      authorAvatar: c.author?.avatar_url || null,
      date: c.commit?.author?.date || null,
      htmlUrl: c.html_url,
    }));

    res.json({ commits, count: commits.length });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────
// @desc    Get contributors from GitHub
// @route   GET /api/projects/:projectId/github/contributors
// @access  Private
// ──────────────────────────────────────────────────────────
const getContributors = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await getAuthorizedProject(projectId, req.user._id, res, next);
    if (!project) return;

    const coords = getRepoCoords(project, res, next);
    if (!coords) return;

    const raw = await githubService.getContributors(coords.owner, coords.repo, 20);

    const contributors = raw.map((c) => ({
      login: c.login,
      avatar: c.avatar_url,
      contributions: c.contributions,
      profileUrl: c.html_url,
    }));

    res.json({ contributors, count: contributors.length });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────
// @desc    Get branches from GitHub
// @route   GET /api/projects/:projectId/github/branches
// @access  Private
// ──────────────────────────────────────────────────────────
const getBranches = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await getAuthorizedProject(projectId, req.user._id, res, next);
    if (!project) return;

    const coords = getRepoCoords(project, res, next);
    if (!coords) return;

    const raw = await githubService.getBranches(coords.owner, coords.repo, 30);

    const branches = raw.map((b) => ({
      name: b.name,
      protected: b.protected,
      sha: b.commit?.sha?.substring(0, 7) || null,
    }));

    res.json({ branches, count: branches.length });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────
// @desc    Get pull requests from GitHub
// @route   GET /api/projects/:projectId/github/pull-requests
// @access  Private
// ──────────────────────────────────────────────────────────
const getPullRequests = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await getAuthorizedProject(projectId, req.user._id, res, next);
    if (!project) return;

    const coords = getRepoCoords(project, res, next);
    if (!coords) return;

    const raw = await githubService.getPullRequests(coords.owner, coords.repo, 'all', 30);

    const prs = raw.map((pr) => ({
      number: pr.number,
      title: pr.title,
      author: pr.user?.login,
      authorAvatar: pr.user?.avatar_url,
      state: pr.merged_at ? 'merged' : pr.state,
      updatedAt: pr.updated_at,
      htmlUrl: pr.html_url,
    }));

    const open = prs.filter((p) => p.state === 'open').length;
    const closed = prs.filter((p) => p.state === 'closed').length;
    const merged = prs.filter((p) => p.state === 'merged').length;

    res.json({ prs, counts: { open, closed, merged, total: prs.length } });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────
// @desc    Get issues from GitHub (excludes PRs)
// @route   GET /api/projects/:projectId/github/issues
// @access  Private
// ──────────────────────────────────────────────────────────
const getIssues = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await getAuthorizedProject(projectId, req.user._id, res, next);
    if (!project) return;

    const coords = getRepoCoords(project, res, next);
    if (!coords) return;

    const raw = await githubService.getIssues(coords.owner, coords.repo, 'all', 30);

    const issues = raw.map((issue) => ({
      number: issue.number,
      title: issue.title,
      author: issue.user?.login,
      authorAvatar: issue.user?.avatar_url,
      state: issue.state,
      labels: (issue.labels || []).map((l) => ({ name: l.name, color: l.color })),
      updatedAt: issue.updated_at,
      htmlUrl: issue.html_url,
    }));

    const open = issues.filter((i) => i.state === 'open').length;
    const closed = issues.filter((i) => i.state === 'closed').length;

    res.json({ issues, counts: { open, closed, total: issues.length } });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────
// @desc    Sync real GitHub commits as contributions (dedup by SHA)
// @route   POST /api/projects/:projectId/github/sync
// @access  Private
// ──────────────────────────────────────────────────────────
const syncGitHubCommits = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await getAuthorizedProject(projectId, req.user._id, res, next);
    if (!project) return;

    const coords = getRepoCoords(project, res, next);
    if (!coords) return;

    const rawCommits = await githubService.getCommits(coords.owner, coords.repo, 30);

    // Deduplicate by SHA — check existing contributions with source='github'
    const existingContribs = await Contribution.find({
      projectId,
      source: 'github',
    }).select('description');

    // Extract SHAs already stored (description contains the SHA)
    const storedShas = new Set(
      existingContribs
        .map((c) => {
          const match = c.description?.match(/\[SHA:([a-f0-9]+)\]/);
          return match ? match[1] : null;
        })
        .filter(Boolean)
    );

    const newContributions = [];

    for (const commit of rawCommits) {
      const sha = commit.sha;
      if (storedShas.has(sha)) continue; // Skip already imported

      // Try to match commit author to a project member by GitHub username
      const authorLogin = commit.author?.login;
      let assignedUser = req.user; // fallback to requester

      if (authorLogin) {
        const match = project.members.find(
          (m) => m.user.githubUsername?.toLowerCase() === authorLogin.toLowerCase()
        );
        if (match) assignedUser = match.user;
      }

      const message = commit.commit?.message?.split('\n')[0] || 'GitHub Commit';
      const shortSha = sha.substring(0, 7);

      // Score: commits with conventional prefixes get higher scores
      let score = 5;
      if (/^feat/i.test(message)) score = 8;
      else if (/^fix/i.test(message)) score = 7;
      else if (/^refactor/i.test(message)) score = 6;
      else if (/^docs/i.test(message)) score = 3;
      else if (/^test/i.test(message)) score = 4;
      else if (/^chore/i.test(message)) score = 3;

      const contribution = await Contribution.create({
        projectId,
        userId: assignedUser._id,
        type: 'code',
        title: `GitHub Commit [${shortSha}]: ${message.substring(0, 60)}`,
        description: `[SHA:${sha}] ${message} — imported from ${coords.normalizedUrl}`,
        impactScore: score,
        source: 'github',
      });

      newContributions.push(contribution);
    }

    res.status(201).json({
      success: true,
      message: newContributions.length > 0
        ? `Successfully imported ${newContributions.length} new commit(s).`
        : 'All commits are already synchronized. No new imports needed.',
      imported: newContributions.length,
      skipped: rawCommits.length - newContributions.length,
    });
  } catch (error) {
    next(error);
  }
};

// Keep legacy import for backward compat (now calls real sync)
const importMockContributions = syncGitHubCommits;

module.exports = {
  getGitHubStatus,
  getRepository,
  getCommits,
  getContributors,
  getBranches,
  getPullRequests,
  getIssues,
  syncGitHubCommits,
  importMockContributions, // legacy alias
};

const Project = require('../models/Project');
const Contribution = require('../models/Contribution');
const User = require('../models/User');
const githubService = require('../services/githubService');

// @desc    Import mock contributions from GitHub
// @route   POST /api/projects/:projectId/github/import
// @access  Private
const importMockContributions = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // 1. Verify project exists
    const project = await Project.findById(projectId).populate('members.user');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // 2. Verify membership
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to access this project'));
    }

    // 3. Verify repoUrl is configured
    if (!project.repoUrl) {
      res.status(400);
      return next(
        new Error('Please configure a repository URL for this project first')
      );
    }

    // 4. Find members with configured githubUsername (fallback to requester user)
    const activeContributors = project.members.filter(
      (m) => m.user.githubUsername
    );

    const targetUsers = activeContributors.length > 0
      ? activeContributors.map((m) => m.user)
      : [req.user];

    // Fetch mock commits from service
    const mockCommits = githubService.fetchMockCommits();

    const createdContributions = [];

    // Create a mock contribution for each mock commit
    for (let i = 0; i < mockCommits.length; i++) {
      const commit = mockCommits[i];
      const assignedUser = targetUsers[i % targetUsers.length];
      const commitHash = Math.random().toString(16).substring(2, 9);

      const contribution = await Contribution.create({
        projectId,
        userId: assignedUser._id,
        type: 'code',
        title: `GitHub Commit ${commitHash}`,
        description: `[GitHub Commit ${commitHash}] ${commit.message} (imported via ${project.repoUrl})`,
        impactScore: commit.score, // already between 3 and 10 in service
        source: 'github',
      });

      createdContributions.push(contribution);
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${mockCommits.length} commits from GitHub repository.`,
      repository: project.repoUrl,
      importedCount: mockCommits.length,
      contributions: createdContributions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get GitHub integration status for project
// @route   GET /api/projects/:projectId/github/status
// @access  Private
const getGitHubStatus = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Verify membership
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to access this project'));
    }

    const connected = !!project.repoUrl;

    // Find the last imported contribution from GitHub
    const lastContribution = await Contribution.findOne({
      projectId,
      source: 'github',
    })
      .sort({ createdAt: -1 });

    const lastImportedAt = lastContribution ? lastContribution.createdAt : null;

    res.json({
      repoUrl: project.repoUrl || '',
      connected,
      lastImportedAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  importMockContributions,
  getGitHubStatus,
};

const Project = require('../models/Project');
const Task = require('../models/Task');
const Contribution = require('../models/Contribution');
const ChatHistory = require('../models/ChatHistory');
const calculateProjectAnalytics = require('../utils/calculateAnalytics');
const { processAIQuery, generateDailySummaryText, generateSprintPlanAssignments } = require('../services/aiService');
const { generateProjectReportPDF } = require('../services/pdfService');

// @desc    Get chat history for a project
// @route   GET /api/ai/:projectId/chat
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const history = await ChatHistory.find({ projectId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Ask AI Workspace Assistant
// @route   POST /api/ai/:projectId/chat
// @access  Private
const globalChatHandler = async (req, res, next) => {
  try {
    const { message, projectId } = req.body;
    if (!message || message.trim() === '') {
      res.status(400);
      return next(new Error('Message cannot be empty'));
    }
    if (projectId) {
      // reuse existing logic similar to askAssistant
      const project = await Project.findById(projectId).populate('members.user', 'name email role');
      if (!project) {
        res.status(404);
        return next(new Error('Project not found'));
      }
      const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
      if (!isMember) {
        res.status(403);
        return next(new Error('Not authorized to access AI for this project'));
      }
      const tasks = await Task.find({ projectId });
      const contributions = await Contribution.find({ projectId });
      const analytics = calculateProjectAnalytics(project, tasks, contributions);
      const reply = await processAIQuery(projectId, req.user._id, message, project, tasks, contributions, analytics);
      return res.json({ reply });
    }
    // generic response when no projectId
    const genericReply = "I can help you with project insights. Provide a projectId in the request to get detailed answers about status, tasks, contributions, etc.";
    return res.json({ reply: genericReply });
  } catch (error) {
    next(error);
  }
};

// @desc    Ask AI Project Assistant
// @route   POST /api/ai/:projectId/chat
// @access  Private
const askAssistant = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      res.status(400);
      return next(new Error('Query message cannot be empty'));
    }

    const project = await Project.findById(projectId).populate('members.user', 'name email role');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Verify workspace membership
    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to access AI for this project'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });
    const analytics = calculateProjectAnalytics(project, tasks, contributions);

    // Save user's query
    const userMessage = await ChatHistory.create({
      projectId,
      userId: req.user._id,
      sender: 'user',
      text: message,
    });

    // Run intelligence processor
    const responseText = await processAIQuery(projectId, req.user._id, message, project, tasks, contributions, analytics);

    // Save AI response
    const aiMessage = await ChatHistory.create({
      projectId,
      userId: req.user._id,
      sender: 'ai',
      text: responseText,
    });

    res.json({
      userMessage,
      aiMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get automated AI daily summary card metrics
// @route   GET /api/ai/:projectId/summary
// @access  Private
const getDailySummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('members.user', 'name email role');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });
    const analytics = calculateProjectAnalytics(project, tasks, contributions);

    const summary = generateDailySummaryText(project, tasks, contributions, analytics);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate sprint recommendations plan
// @route   POST /api/ai/:projectId/sprint-plan
// @access  Private
const getSprintPlan = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('members.user', 'name email role');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });
    const analytics = calculateProjectAnalytics(project, tasks, contributions);

    const sprintPlan = generateSprintPlanAssignments(project, tasks, contributions, analytics);
    res.json(sprintPlan);
  } catch (error) {
    next(error);
  }
};

// @desc    Export sprint intelligence data report
// @route   GET /api/ai/:projectId/export
// @access  Private
const exportReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { reportType = 'Sprint', format = 'pdf' } = req.query;

    const project = await Project.findById(projectId).populate('members.user', 'name email role');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });
    const analytics = calculateProjectAnalytics(project, tasks, contributions);

    if (format.toLowerCase() === 'pdf') {
      const pdfBuffer = await generateProjectReportPDF(project, tasks, contributions, analytics, reportType);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=SyncScore_Report_${reportType}.pdf`);
      return res.send(pdfBuffer);
    } 
    
    // Default CSV formatting
    let csv = `SyncScore AI - Intelligence Report (${reportType} Assessment)\n`;
    csv += `Project Title,${project.title}\n`;
    csv += `Deadline,${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}\n`;
    csv += `Sprint Status,${project.status || 'Active'}\n`;
    csv += `Health Score,${analytics.healthScore}/100\n`;
    csv += `Progress,${analytics.projectProgressPercentage}%\n`;
    csv += `Overdue Tasks,${analytics.overdueTasks}\n`;
    csv += `Deadline Risk,${analytics.deadlineRisk.toUpperCase()}\n`;
    csv += `\nTeam Workloads & Contributions\n`;
    csv += `Name,Role,Contribution Score,Productivity Score,Consistency Rating,Quality Rating,Total Tasks,Completed Tasks,Burnout Risk\n`;
    
    analytics.memberWorkload.forEach(m => {
      csv += `"${m.user.name}","${m.projectRole}",${m.contributionScore},${m.productivity},"${m.consistency}%","${m.quality}%",${m.totalTasks},${m.completedTasks},${m.burnoutRisk ? 'YES' : 'NO'}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=SyncScore_Report_${reportType}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatHistory,
  askAssistant,
  getDailySummary,
  getSprintPlan,
  exportReport,
  globalChatHandler,
};

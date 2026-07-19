const { GoogleGenAI } = require('@google/generative-ai');
const calculateProjectAnalytics = require('../utils/calculateAnalytics');

// Helper to analyze the project data locally and return structured markdown answers
const runLocalReasoner = (query, project, tasks, contributions, analytics) => {
  const normalizedQuery = query.toLowerCase();

  // 1. Who contributed most?
  if (normalizedQuery.includes('contribute') || normalizedQuery.includes('leaderboard') || normalizedQuery.includes('most active')) {
    const sortedContributors = [...analytics.memberWorkload].sort((a, b) => b.productivity - a.productivity);
    let response = `### 🏆 Contribution Analytics Leaderboard\n\n`;
    if (sortedContributors.length === 0) {
      return response + "No contributions have been recorded yet.";
    }
    response += sortedContributors.map((c, i) => {
      const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '▪';
      return `${rank} **${c.user.name}** (Role: \`${c.projectRole}\`) — **Score: ${c.contributionScore}**\n   - Productivity Impact: \`${c.productivity}\` pts\n   - Quality Score: \`${c.quality}%\` | Consistency: \`${c.consistency}%\` | Completed Tasks: \`${c.completedTasks}/${c.totalTasks}\``;
    }).join('\n\n');
    return response;
  }

  // 2. Why is project delayed / due date risk / why is health low?
  if (normalizedQuery.includes('delay') || normalizedQuery.includes('risk') || normalizedQuery.includes('health') || normalizedQuery.includes('status')) {
    let response = `### ⚠️ Project Risk & Health Analysis\n\n`;
    response += `* **Overall Health Score:** \`${analytics.healthScore}/100\`\n`;
    response += `* **Deadline Risk:** \`${analytics.deadlineRisk.toUpperCase()}\` Risk\n\n`;
    response += `#### Diagnostic Explanation:\n${analytics.deadlineRiskExplanation}\n\n`;
    response += `#### Recommended Actions:\n`;
    response += analytics.deadlineRiskSuggestions.map(s => `- ${s}`).join('\n');
    
    if (analytics.overdueTasks > 0) {
      response += `\n\nThere are currently **${analytics.overdueTasks} overdue tasks** blocking progress.`;
    }
    if (analytics.inactiveMembers.length > 0) {
      response += `\n* Note: **${analytics.inactiveMembers.length} team members** (e.g., ${analytics.inactiveMembers.map(m => m.user.name).join(', ')}) have been inactive for more than 5 days.`;
    }
    return response;
  }

  // 3. Which tasks are overdue / pending?
  if (normalizedQuery.includes('overdue') || normalizedQuery.includes('late') || normalizedQuery.includes('past due')) {
    const now = new Date();
    const overdueList = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now);
    let response = `### ⏰ Overdue Task Backlog\n\n`;
    if (overdueList.length === 0) {
      return response + "🎉 Great news! There are no overdue tasks in this sprint.";
    }
    response += overdueList.map(t => {
      const assignedName = t.assignedTo ? (project.members.find(m => m.user._id.toString() === t.assignedTo.toString())?.user?.name || 'Unassigned') : 'Unassigned';
      return `- **${t.title}** (Priority: \`${t.priority.toUpperCase()}\`)\n  - Assigned to: \`${assignedName}\` | Due: \`${new Date(t.deadline).toLocaleDateString()}\` | Estimates: \`${t.estimatedHours || 0}h\``;
    }).join('\n');
    return response;
  }

  // 4. Who has the highest workload / burnout?
  if (normalizedQuery.includes('workload') || normalizedQuery.includes('burnout') || normalizedQuery.includes('busy')) {
    let response = `### ⚖️ Workload Balance & Burnout Detection\n\n`;
    const flaggedBurnout = analytics.memberWorkload.filter(w => w.burnoutRisk);
    
    response += analytics.memberWorkload.map(w => {
      const workloadIndicator = w.burnoutRisk ? '⚠️ High (Burnout Risk)' : '🟢 Normal';
      return `- **${w.user.name}**: Workload \`${workloadIndicator}\`\n  - Pending tasks: \`${w.pendingTasks}\` | Est. Hours: \`${w.estimatedHours}h\` (Actual logged: \`${w.actualHours}h\`)`;
    }).join('\n');

    if (flaggedBurnout.length > 0) {
      response += `\n\n**AI Recommendation:** Workload redistribution is advised. Consider shifting tasks from **${flaggedBurnout.map(f => f.user.name).join(', ')}** to members with lower pending estimated hours.`;
    } else {
      response += `\n\nAll members have balanced pending workloads.`;
    }
    return response;
  }

  // 5. Summarize today's work
  if (normalizedQuery.includes('summarize') || normalizedQuery.includes('today') || normalizedQuery.includes('accomplished') || normalizedQuery.includes('recent')) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const recentContributions = contributions.filter(c => new Date(c.createdAt || Date.now()) >= startOfToday);
    
    let response = `### 📅 Daily Project Accomplishment Summary\n\n`;
    response += `* **Tasks Completed Today:** \`${analytics.completedTasks}\` cumulative.\n`;
    response += `* **Project Completion Progress:** \`${analytics.projectProgressPercentage}%\`\n\n`;
    
    if (recentContributions.length === 0) {
      response += "No contributions have been logged yet today. Team members should log accomplishments in the contributions portal.";
    } else {
      response += `#### Logged Activities:\n`;
      response += recentContributions.map(c => {
        const memberName = project.members.find(m => m.user._id.toString() === c.userId.toString())?.user?.name || 'Developer';
        return `- **${memberName}** logged contribution **"${c.title}"** (Impact: \`${c.impactScore}/10\`, Type: \`${c.contributionType}\`)`;
      }).join('\n');
    }
    return response;
  }

  // 6. Predict project completion
  if (normalizedQuery.includes('predict') || normalizedQuery.includes('completion') || normalizedQuery.includes('forecast')) {
    let response = `### 🔮 AI Project Completion Forecast\n\n`;
    const completedTasksCount = analytics.completedTasks;
    const pendingTasksCount = analytics.pendingTasks;
    
    if (completedTasksCount === 0) {
      response += "Insufficient velocity telemetry to accurately forecast project completion. Please complete initial tasks to seed predictions.";
      return response;
    }

    // Estimate project velocity (tasks completed per week since creation date)
    const creation = new Date(project.createdAt || Date.now() - 14 * 24 * 60 * 60 * 1000);
    const weeksActive = Math.max(0.5, (Date.now() - creation.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const velocityPerWeek = completedTasksCount / weeksActive;
    const weeksToFinish = velocityPerWeek > 0 ? (pendingTasksCount / velocityPerWeek) : 0;
    
    const predictedFinishDate = new Date(Date.now() + weeksToFinish * 7 * 24 * 60 * 60 * 1000);

    response += `* **Weekly Velocity:** \`${velocityPerWeek.toFixed(1)}\` completed tasks / week.\n`;
    response += `* **Estimated Sprints Remaining:** \`${weeksToFinish.toFixed(1)}\` weeks.\n`;
    response += `* **Predicted Completion Date:** \`${predictedFinishDate.toLocaleDateString()}\`.\n\n`;
    
    if (project.deadline) {
      const deadline = new Date(project.deadline);
      if (predictedFinishDate > deadline) {
        response += `⚠️ **Warning:** The predicted completion date is **past the sprint deadline** (\`${deadline.toLocaleDateString()}\`). Increase weekly velocity by reassigning tasks or scoping down requirements.`;
      } else {
        response += `🟢 **On Track:** Project is predicted to complete prior to the deadline (\`${deadline.toLocaleDateString()}\`).`;
      }
    }
    return response;
  }

  // General default fallback prompt answer
  return `### 🤖 SyncScore AI Workspace Assistant

Hello! I have full context on the workspace:
* **Tasks Backlog:** ${tasks.length} total (${analytics.completedTasks} completed, ${analytics.pendingTasks} pending).
* **Workspace Health:** \`${analytics.healthScore}/100\`
* **Active Developers:** ${project.members.length} members.

**Try asking me specific queries:**
- *"Why is the project delayed?"*
- *"Who contributed the most?"*
- *"Which tasks are overdue?"*
- *"Who has the highest workload?"*
- *"Summarize today's work."*
- *"Predict project completion date."*`;
};

// Generates an automated daily summary card content
const generateDailySummaryText = (project, tasks, contributions, analytics) => {
  const flaggedBurnout = analytics.memberWorkload.filter(w => w.burnoutRisk);
  const inactiveNames = analytics.inactiveMembers.map(m => m.user.name);
  
  let recommendations = [];
  if (analytics.overdueTasks > 0) {
    recommendations.push("Prioritize clearing overdue tasks immediately.");
  }
  if (flaggedBurnout.length > 0) {
    recommendations.push(`Balance workload: redistributing tasks from ${flaggedBurnout.map(f => f.user.name).join(', ')} is suggested.`);
  }
  if (inactiveNames.length > 0) {
    recommendations.push(`Check in with inactive members: ${inactiveNames.join(', ')}.`);
  }
  if (analytics.deadlineRisk === 'high') {
    recommendations.push("Accelerate sprint: high deadline delay threat detected.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Velocity is nominal. Maintain sprint momentum.");
  }

  return {
    todayTasksCount: tasks.length,
    completedTasksCount: analytics.completedTasks,
    pendingTasksCount: analytics.pendingTasks,
    inactiveMembersCount: analytics.inactiveMembers.length,
    healthScore: analytics.healthScore,
    deadlineRisk: analytics.deadlineRisk,
    burnoutAlertsCount: flaggedBurnout.length,
    recommendations,
  };
};

// Generates a mock/rule-based Sprint Plan
const generateSprintPlanAssignments = (project, tasks, contributions, analytics) => {
  // Filters pending tasks
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const members = analytics.memberWorkload;

  const plan = pendingTasks.map((t, idx) => {
    // Sort members by pending workload hours ascending to select lowest loaded member
    const sortedMembers = [...members].sort((a, b) => {
      if (a.burnoutRisk && !b.burnoutRisk) return 1;
      if (!a.burnoutRisk && b.burnoutRisk) return -1;
      return a.pendingTasks - b.pendingTasks;
    });

    const recommendedAssignee = sortedMembers[0]?.user;
    
    // Update local workload stats to distribute next task correctly
    const memberIndex = members.findIndex(m => m.user._id.toString() === recommendedAssignee._id.toString());
    if (memberIndex !== -1) {
      members[memberIndex].pendingTasks += 1;
    }

    return {
      taskId: t._id,
      taskTitle: t.title,
      currentAssigneeId: t.assignedTo,
      recommendedAssigneeId: recommendedAssignee?._id,
      recommendedAssigneeName: recommendedAssignee?.name,
      priority: t.priority,
      reason: `Assigned to ${recommendedAssignee?.name} based on lowest current pending tasks workload (${sortedMembers[0]?.pendingTasks || 0} tasks).`,
    };
  });

  return plan;
};

// Core query processing function
const processAIQuery = async (projectId, userId, query, project, tasks, contributions, analytics) => {
  // If GEMINI_API_KEY is available, run advanced LLM generation
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Formulate detailed background prompt context
      const contextPrompt = `
You are the AI Project Intelligence Assistant for the SyncScore AI platform.
You have access to the complete database status for the project "${project.title}".

PROJECT CONTEXT:
- Total Tasks: ${tasks.length}
- Completed Tasks: ${analytics.completedTasks}
- Pending Tasks: ${analytics.pendingTasks}
- Overdue Tasks: ${analytics.overdueTasks}
- Progress: ${analytics.projectProgressPercentage}%
- Project Health Score: ${analytics.healthScore}/100
- Deadline Risk: ${analytics.deadlineRisk} (${analytics.deadlineRiskExplanation})
- Inactive Members: ${analytics.inactiveMembers.map(m => m.user.name).join(', ') || 'None'}
- Team Members Workload:
${analytics.memberWorkload.map(w => `- ${w.user.name}: Role=${w.projectRole}, PendingTasks=${w.pendingTasks}, EstHours=${w.estimatedHours}h, ActualHours=${w.actualHours}h, BurnoutRisk=${w.burnoutRisk ? 'YES' : 'NO'}, ContributionScore=${w.contributionScore}`).join('\n')}

USER QUERY: "${query}"

Generate a structured, professional, and actionable markdown answer. Focus on diagnosing problems ("Why did it happen?") and proposing solutions ("What should we do next?"). Keep the response concise but highly detailed and SaaS-like.
`;
      
      const result = await model.generateContent(contextPrompt);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      console.error("Gemini API call failed, falling back to local reasoner:", err);
    }
  }

  // Default fallback to local parser logic
  return runLocalReasoner(query, project, tasks, contributions, analytics);
};

module.exports = {
  processAIQuery,
  generateDailySummaryText,
  generateSprintPlanAssignments,
};

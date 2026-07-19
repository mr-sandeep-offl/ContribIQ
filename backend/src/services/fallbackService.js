/**
 * Rule-based fallback service for SyncScore AI Assistant.
 * Generates project-aware responses using real MongoDB database context when Groq is unavailable.
 */

const getRuleBasedResponse = ({ message, projectContext, isSingleProject }) => {
  const query = (message || '').toLowerCase();
  
  // Parse project context to extract real metrics if available
  // The context built in projectContext will be a structured string, we can search it or use raw data.
  // To make it extremely reliable, we'll design a smart response parser that reads from the context string or provides a robust structure.
  
  if (!projectContext) {
    return `Hello! I am your rule-based AI Assistant. 
Currently, no project context is loaded or available. Please select a project or ensure you are authorized.`;
  }

  // --- Helpers for query matching ---
  const matches = (keywords) => keywords.some(k => query.includes(k));

  if (isSingleProject) {
    // ─────────────── SINGLE PROJECT FALLBACKS ───────────────
    if (matches(['status', 'health', 'progress'])) {
      // Find Sprint Health or progress lines from the context
      const lines = projectContext.split('\n');
      const titleLine = lines.find(l => l.includes('Project:')) || 'this project';
      const healthLine = lines.find(l => l.includes('Sprint Health:')) || '';
      const progressLine = lines.find(l => l.includes('Progress:')) || '';
      const statusLine = lines.find(l => l.includes('Status:')) || '';
      const riskLine = lines.find(l => l.includes('Deadline Risk:')) || '';

      return `**Project Status & Health Report**

For **${titleLine.replace('Project:', '').trim()}**:
- **Status**: ${statusLine.replace('- Status:', '').trim() || 'Planning/Active'}
- **Sprint Health**: ${healthLine.replace('- Sprint Health:', '').trim() || 'Not available'}
- **Project Progress**: ${progressLine.replace('- Progress:', '').trim() || '0%'}
- **Deadline Risk**: ${riskLine.replace('- Deadline Risk:', '').trim() || 'Low'}

*Recommendation*: Keep tracking tasks and synchronize GitHub commits regularly to maintain sprint velocity.`;
    }

    if (matches(['task', 'pending', 'todo', 'in progress'])) {
      const lines = projectContext.split('\n');
      const taskLines = lines.filter(l => l.includes('Task [') || l.includes('Tasks count:'));
      
      if (taskLines.length === 0) {
        return `No tasks were found in the context for this project. Use the Task Board to log work.`;
      }

      return `**Tasks & Sprint Backlog**

Here is a summary of the tasks for this project:
${taskLines.map(l => `- ${l.trim()}`).join('\n')}

Please focus on completing any tasks that are currently "in progress" or "todo" before the next sprint review.`;
    }

    if (matches(['overdue', 'late', 'past'])) {
      const lines = projectContext.split('\n');
      const overdueLines = lines.filter(l => l.includes('OVERDUE'));
      
      if (overdueLines.length === 0) {
        return `Good news! There are no overdue tasks registered for this project in the current sprint context.`;
      }

      return `**⚠️ Overdue Tasks Alert**

The following tasks have passed their deadlines:
${overdueLines.map(l => `- ${l.trim()}`).join('\n')}

*Suggested Action*: Reassign these tasks to available team members or extend the deadlines if scope changes are approved.`;
    }

    if (matches(['contributor', 'who', 'commit', 'member'])) {
      const lines = projectContext.split('\n');
      const memberLines = lines.filter(l => l.includes('Member:'));
      const githubLines = lines.filter(l => l.includes('GitHub Contributor:'));

      let reply = `**Sprint Contributor Overview**\n\n`;
      if (memberLines.length > 0) {
        reply += `**Project Members:**\n${memberLines.map(l => `- ${l.trim().replace('Member:', '')}`).join('\n')}\n\n`;
      }
      if (githubLines.length > 0) {
        reply += `**GitHub Activity (Commits):**\n${githubLines.map(l => `- ${l.trim().replace('GitHub Contributor:', '')}`).join('\n')}\n`;
      } else {
        reply += `No GitHub contributions or commits have been synced yet. Connect your repository to see real contributor metrics.`;
      }
      return reply;
    }

    if (matches(['deadline', 'risk', 'date', 'slip'])) {
      const lines = projectContext.split('\n');
      const deadlineLine = lines.find(l => l.includes('Deadline:')) || '';
      const riskLine = lines.find(l => l.includes('Deadline Risk:')) || '';
      
      return `**Deadline & Schedule Risk Assessment**

- **Project Deadline**: ${deadlineLine.replace('- Deadline:', '').trim() || 'Not set'}
- **Assessed Risk**: ${riskLine.replace('- Deadline Risk:', '').trim() || 'Low'}

*Analysis*: Project completion timeline is tracked based on remaining backlog. Reevaluate tasks that have high estimation uncertainty.`;
    }

    if (matches(['recommendation', 'next', 'work', 'suggest'])) {
      return `**AI-Recommended Next Actions**

Based on project metrics:
1. **GitHub Sync**: If you have made commits, sync them to update the contribution scoring.
2. **Backlog Triage**: Review the Task Board and move completed items to Done.
3. **Daily Sync**: Address any blocked tasks that are approaching their deadline.`;
    }

    // Default query response for single project
    const lines = projectContext.split('\n');
    const titleLine = lines.find(l => l.includes('Project:')) || 'this project';
    return `Hello! I am your SyncScore AI Assistant (operating in rule-based fallback mode).

I'm ready to help with **${titleLine.replace('Project:', '').trim()}**. Ask me about:
- **Project status / health** ("What is my project status?")
- **Pending/overdue tasks** ("Which tasks are overdue?")
- **Contributors** ("Who contributed the most?")
- **Deadlines and recommendations** ("What should I work on next?")`;

  } else {
    // ─────────────── ALL PROJECTS / WORKSPACE FALLBACKS ───────────────
    if (matches(['status', 'health', 'progress', 'summary', 'workspace'])) {
      const lines = projectContext.split('\n');
      const summaryLines = lines.filter(l => l.startsWith('- ') && !l.includes('Task ['));
      
      return `**Workspace Status & Project Summary**

Here is a summary of your workspace:
${summaryLines.map(l => l.trim()).join('\n')}

*Recommendation*: Check individual project dashboards for detailed sprint velocity.`;
    }

    if (matches(['task', 'pending', 'todo', 'in progress'])) {
      const lines = projectContext.split('\n');
      const taskCountLine = lines.find(l => l.includes('Total Tasks:')) || '';
      const pendingLine = lines.find(l => l.includes('Pending Tasks:')) || '';
      const overdueLine = lines.find(l => l.includes('Overdue Tasks:')) || '';

      return `**Workspace Task Backlog Summary**

- **${taskCountLine.trim() || 'Tasks'}**
- **${pendingLine.trim() || 'Pending tasks'}**
- **${overdueLine.trim() || 'Overdue tasks'}**

Please visit the individual project Task Boards to view detailed task descriptions and assignees.`;
    }

    if (matches(['overdue', 'late'])) {
      const lines = projectContext.split('\n');
      const overdueLine = lines.find(l => l.includes('Overdue Tasks:')) || '';
      
      return `**⚠️ Overdue Tasks Summary**

- **${overdueLine.trim() || 'No overdue tasks found'}**

Please check your project boards immediately and update status or deadline dates.`;
    }

    if (matches(['risk', 'deadline'])) {
      const lines = projectContext.split('\n');
      const riskLine = lines.find(l => l.includes('High Risk Projects:')) || '';
      
      return `**Workspace Schedule & Deadline Risks**

- **${riskLine.trim() || 'No high risk projects flagged'}**

Please ensure high-risk tasks are adequately staffed to prevent project delivery delays.`;
    }

    // Default query response for workspace
    return `Hello! I am your SyncScore AI Assistant (operating in rule-based workspace fallback mode).

I've loaded your workspace overview. You can ask me questions like:
- "Summarize my projects."
- "Which tasks are pending?"
- "Which deadlines are at risk?"
- "Who contributed the most?" (Select a specific project for exact team details)`;
  }
};

module.exports = {
  getRuleBasedResponse,
};

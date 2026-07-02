const generateAISummary = (projectName, analytics) => {
  const {
    projectProgressPercentage,
    deadlineRisk,
    overdueTasks,
    memberContributionPercentages,
    inactiveMembers,
  } = analytics;

  // 1. Progress and risk sentence
  const progressText = `${projectName} is ${projectProgressPercentage}% complete with ${deadlineRisk} deadline risk.`;

  // 2. Top contributor sentence
  let topContributorText = 'No contributions have been logged yet.';
  if (memberContributionPercentages && memberContributionPercentages.length > 0) {
    const sorted = [...memberContributionPercentages].sort(
      (a, b) => b.contributionPercentage - a.contributionPercentage
    );
    const topMember = sorted[0];
    if (topMember && topMember.totalImpactScore > 0) {
      topContributorText = `${topMember.user.name} is the top contributor with ${Math.round(topMember.contributionPercentage)}%.`;
    }
  }

  // 3. Overdue tasks text
  const numberWords = {
    0: 'No',
    1: 'One',
    2: 'Two',
    3: 'Three',
    4: 'Four',
    5: 'Five',
  };
  const overdueCountWord = numberWords[overdueTasks] || overdueTasks.toString();
  const overdueText = `${overdueCountWord} task${overdueTasks === 1 ? '' : 's'} ${overdueTasks === 1 ? 'is' : 'are'} overdue`;

  // 4. Inactivity text
  let inactivityText = 'and all team members are active.';
  if (inactiveMembers && inactiveMembers.length > 0) {
    const names = inactiveMembers.map((m) => m.name).join(', ');
    inactivityText = `and ${names} has been inactive for 5 days.`;
  }

  // 5. Suggested next action
  let suggestedAction = 'Recommended action: continue with the active sprint tasks.';
  if (overdueTasks > 0) {
    suggestedAction = 'Recommended action: complete overdue backend tasks first.';
  } else if (deadlineRisk === 'high' || deadlineRisk === 'medium') {
    suggestedAction = 'Recommended action: accelerate remaining pending tasks to resolve deadline bottlenecks.';
  } else if (projectProgressPercentage === 100) {
    suggestedAction = 'Recommended action: project is fully completed. Review and archive.';
  }

  // Combine into the final narrative matching the requested style
  const summary = `${progressText} ${topContributorText} ${overdueText} ${inactivityText} ${suggestedAction}`;

  return summary;
};

module.exports = generateAISummary;

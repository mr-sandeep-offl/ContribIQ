const calculateProjectAnalytics = (project, tasks, contributions) => {
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  // 1. Task counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
  
  // Overdue if not completed and task deadline has passed
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'completed' && new Date(t.deadline) < now
  ).length;

  // 2. Project progress percentage
  const projectProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3. Member contribution percentage
  // Sum of impactScore for all contributions in this project
  const totalImpactScore = contributions.reduce((sum, c) => sum + c.impactScore, 0);

  // Group contributions by user and sum impactScore
  const memberImpactMap = {};
  contributions.forEach((c) => {
    const userId = c.userId.toString();
    memberImpactMap[userId] = (memberImpactMap[userId] || 0) + c.impactScore;
  });

  // Map each project member to their name, email, and contribution percentage
  const memberContributionPercentages = project.members.map((member) => {
    const userId = member.user._id.toString();
    const userImpact = memberImpactMap[userId] || 0;
    const contributionPercentage = totalImpactScore > 0 ? parseFloat(((userImpact / totalImpactScore) * 100).toFixed(2)) : 0;

    return {
      user: {
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
      },
      projectRole: member.projectRole || member.role,
      totalImpactScore: userImpact,
      contributionPercentage,
    };
  });

  // 4. Inactive members (no contribution and no completed task in last 5 days)
  const inactiveMembers = project.members
    .filter((member) => {
      const uId = member.user._id.toString();

      // Check if user has any contributions in the last 5 days
      const hasRecentContribution = contributions.some(
        (c) => c.userId.toString() === uId && new Date(c.createdAt || c.date) >= fiveDaysAgo
      );

      // Check if user has completed any tasks in the last 5 days
      const hasRecentCompletedTask = tasks.some(
        (t) => t.assignedTo && t.assignedTo.toString() === uId && t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= fiveDaysAgo
      );

      // Inactive if they have neither
      return !hasRecentContribution && !hasRecentCompletedTask;
    })
    .map((member) => ({
      _id: member.user._id,
      name: member.user.name,
      email: member.user.email,
    }));

  // 5. Deadline risk assessment
  // - high if deadline is within 3 days and progress below 70%
  // - medium if deadline is within 7 days and progress below 80%
  // - low otherwise
  let deadlineRisk = 'low';
  if (project.deadline) {
    const projectDeadline = new Date(project.deadline);
    const msToDeadline = projectDeadline.getTime() - now.getTime();
    const daysToDeadline = msToDeadline / (24 * 60 * 60 * 1000);

    if (daysToDeadline <= 3 && projectProgressPercentage < 70) {
      deadlineRisk = 'high';
    } else if (daysToDeadline <= 7 && projectProgressPercentage < 80) {
      deadlineRisk = 'medium';
    }
  }

  // 6. Health Score Calculation (0 to 100)
  // Combines: progress, contribution balance, overdue tasks, and inactive members
  let healthScore = 100;

  // Deduct proportional to incomplete progress (max deduction 30 points)
  healthScore -= (100 - projectProgressPercentage) * 0.3;

  // Deduct for overdue tasks (-10 per overdue task, max deduction 30 points)
  healthScore -= Math.min(30, overdueTasks * 10);

  // Deduct for inactive members (-10 per inactive member, max deduction 30 points)
  healthScore -= Math.min(30, inactiveMembers.length * 10);

  // Contribution balance deduction (deduct if there's high imbalance among active contributors)
  if (memberContributionPercentages.length > 1 && totalImpactScore > 0) {
    const percentages = memberContributionPercentages.map((m) => m.contributionPercentage);
    const maxPct = Math.max(...percentages);
    const minPct = Math.min(...percentages);
    if (maxPct - minPct > 60) {
      healthScore -= 10; // Deduct 10 points if the gap is greater than 60%
    }
  }

  // Ensure health score is bounded between 0 and 100
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  return {
    projectTitle: project.title,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    projectProgressPercentage,
    memberContributionPercentages,
    inactiveMembers,
    deadlineRisk,
    healthScore,
  };
};

module.exports = calculateProjectAnalytics;

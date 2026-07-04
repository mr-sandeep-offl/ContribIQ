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
  let deadlineRiskExplanation = 'Project timeline is on schedule with nominal pending workloads.';
  let deadlineRiskSuggestions = ['Maintain current sprint velocity.', 'Continue monitoring task completions.'];

  if (project.deadline) {
    const projectDeadline = new Date(project.deadline);
    const msToDeadline = projectDeadline.getTime() - now.getTime();
    const daysToDeadline = msToDeadline / (24 * 60 * 60 * 1000);

    if (daysToDeadline < 0) {
      deadlineRisk = 'high';
      deadlineRiskExplanation = 'Project delivery deadline has already passed with incomplete task items remaining.';
      deadlineRiskSuggestions = ['Deploy fallback timeline schedules.', 'Reassign pending tasks to active team members immediately.'];
    } else if (daysToDeadline <= 3 && projectProgressPercentage < 70) {
      deadlineRisk = 'high';
      deadlineRiskExplanation = `Project deadline is in ${Math.ceil(daysToDeadline)} days, but only ${projectProgressPercentage}% of tasks are completed. High risk of missing deadline.`;
      deadlineRiskSuggestions = ['Reassign remaining tasks to top contributors.', 'Postpone non-critical tasks.', 'Schedule emergency sync meeting.'];
    } else if (daysToDeadline <= 7 && projectProgressPercentage < 80) {
      deadlineRisk = 'medium';
      deadlineRiskExplanation = `Project deadline is in ${Math.ceil(daysToDeadline)} days, with completion progress at ${projectProgressPercentage}%. Moderate risk of delay.`;
      deadlineRiskSuggestions = ['Accelerate review tasks.', 'Reassign tasks from inactive members.', 'Enable mock commit imports.'];
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

  // 7. Activity Heatmap (counts of contributions/activities per date over last 30 days)
  const heatmapData = {};
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Initialize last 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().substring(0, 10);
    heatmapData[dateStr] = 0;
  }

  contributions.forEach((c) => {
    const dateStr = new Date(c.createdAt || c.date || now).toISOString().substring(0, 10);
    if (heatmapData[dateStr] !== undefined) {
      heatmapData[dateStr] += 1;
    }
  });

  const activityHeatmap = Object.keys(heatmapData).map((date) => ({
    date,
    count: heatmapData[date],
  })).sort((a, b) => a.date.localeCompare(b.date));

  // 8. Weekly Productivity Trend (contribution score over last 4 weeks)
  const weeklyTrends = [
    { name: 'Week 1', score: 0 },
    { name: 'Week 2', score: 0 },
    { name: 'Week 3', score: 0 },
    { name: 'Week 4', score: 0 }
  ];

  contributions.forEach((c) => {
    const cDate = new Date(c.createdAt || now);
    const daysAgo = (now.getTime() - cDate.getTime()) / (24 * 60 * 60 * 1000);
    if (daysAgo <= 7) {
      weeklyTrends[3].score += c.impactScore; // Week 4 (current week)
    } else if (daysAgo <= 14) {
      weeklyTrends[2].score += c.impactScore; // Week 3
    } else if (daysAgo <= 21) {
      weeklyTrends[1].score += c.impactScore; // Week 2
    } else if (daysAgo <= 28) {
      weeklyTrends[0].score += c.impactScore; // Week 1
    }
  });

  // 9. Detailed Member Workloads, Consistency, Quality and Burnout Risk
  const memberWorkload = project.members.map((m) => {
    const uId = m.user._id.toString();
    const userTasks = tasks.filter(t => t.assignedTo && t.assignedTo.toString() === uId);
    const totalUserTasks = userTasks.length;
    const completedUserTasks = userTasks.filter(t => t.status === 'completed').length;
    const pendingUserTasks = totalUserTasks - completedUserTasks;

    const estimatedHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const actualHours = userTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    // Productivity = sum impact
    const userContributions = contributions.filter(c => c.userId.toString() === uId);
    const productivity = userContributions.reduce((sum, c) => sum + c.impactScore, 0);

    // Consistency = unique contribution days over last 14 days
    const uniqueDays = new Set();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    userContributions.forEach(c => {
      const cDate = new Date(c.createdAt || now);
      if (cDate >= fourteenDaysAgo) {
        uniqueDays.add(cDate.toISOString().substring(0, 10));
      }
    });
    const consistency = Math.min(100, Math.round((uniqueDays.size / 10) * 100)) || 10;

    // Quality = completed tasks / total tasks ratio + average impact rating
    const taskQualityRatio = totalUserTasks > 0 ? (completedUserTasks / totalUserTasks) : 1;
    const avgImpact = userContributions.length > 0
      ? userContributions.reduce((sum, c) => sum + c.impactScore, 0) / userContributions.length
      : 5;
    const quality = Math.min(100, Math.round((taskQualityRatio * 60) + (avgImpact * 4)));

    // Overall Score = Productivity * 0.4 + Consistency * 0.3 + Quality * 0.3
    const finalScore = Math.min(100, Math.round((productivity * 1.5) + (consistency * 0.3) + (quality * 0.3))) || 10;

    // Burnout risk
    const pendingEstimatedHours = userTasks
      .filter(t => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const burnoutRisk = pendingUserTasks > 4 || pendingEstimatedHours > 30;

    return {
      user: {
        _id: m.user._id,
        name: m.user.name,
        email: m.user.email,
      },
      projectRole: m.projectRole || 'member',
      totalTasks: totalUserTasks,
      completedTasks: completedUserTasks,
      pendingTasks: pendingUserTasks,
      estimatedHours,
      actualHours,
      productivity,
      consistency,
      quality,
      contributionScore: finalScore,
      burnoutRisk,
    };
  });

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
    deadlineRiskExplanation,
    deadlineRiskSuggestions,
    healthScore,
    activityHeatmap,
    weeklyTrends,
    memberWorkload,
  };
};

module.exports = calculateProjectAnalytics;

const PDFDocument = require('pdfkit');

const generateProjectReportPDF = (project, tasks, contributions, analytics, reportType = 'Sprint') => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // 1. Cover Header
      doc.fillColor('#6366f1').fontSize(24).text('SyncScore AI - Intelligence Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fillColor('#374151').fontSize(12).text(`Report Type: ${reportType} Assessment`, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.moveDown(1.5);

      // 2. Project Summary
      doc.fillColor('#1f2937').fontSize(16).text('Project Overview', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#4b5563');
      doc.text(`Project Title: ${project.title}`);
      doc.text(`Sprint Status: ${project.status || 'Active'}`);
      doc.text(`Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}`);
      doc.text(`Health Score: ${analytics.healthScore}/100`);
      doc.text(`Progress: ${analytics.projectProgressPercentage}% (${analytics.completedTasks} completed, ${analytics.pendingTasks} pending)`);
      doc.text(`Deadline Risk: ${analytics.deadlineRisk.toUpperCase()} (${analytics.deadlineRiskExplanation})`);
      doc.moveDown(1.5);

      // 3. Leaderboard Workloads
      doc.fillColor('#1f2937').fontSize(16).text('Team Contribution & Workloads', { underline: true });
      doc.moveDown(0.5);
      
      analytics.memberWorkload.forEach((member) => {
        doc.fontSize(11).fillColor('#111827').text(`${member.user.name} (${member.projectRole.toUpperCase()})`);
        doc.fontSize(9.5).fillColor('#4b5563');
        doc.text(`  • Contribution Score: ${member.contributionScore}/100 (Impact Index: ${member.productivity})`);
        doc.text(`  • Consistency rating: ${member.consistency}% | Quality index: ${member.quality}%`);
        doc.text(`  • Assigned tasks: ${member.pendingTasks} pending / ${member.totalTasks} total`);
        doc.text(`  • Tasks estimation: ${member.estimatedHours} hrs estimated / ${member.actualHours} hrs logged`);
        if (member.burnoutRisk) {
          doc.fillColor('#dc2626').text('  • Burnout Risk: Flagged high due to overload!', { bold: true });
          doc.fillColor('#4b5563');
        }
        doc.moveDown(0.5);
      });
      doc.moveDown(1.0);

      // 4. Overdue Backlog
      const overdueList = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date());
      if (overdueList.length > 0) {
        doc.fillColor('#dc2626').fontSize(14).text('Critical Overdue Backlog Items', { underline: true });
        doc.moveDown(0.5);
        overdueList.forEach(t => {
          doc.fontSize(10).fillColor('#b91c1c').text(`  - ${t.title} (Priority: ${t.priority.toUpperCase()}) - Due: ${new Date(t.deadline).toLocaleDateString()}`);
        });
        doc.moveDown(1.5);
      }

      // 5. AI Suggestions / Recommendations
      doc.fillColor('#1f2937').fontSize(16).text('AI Project Recommendations', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#4b5563');
      
      if (analytics.overdueTasks > 0) {
        doc.text('- Focus on clearing critical overdue tasks blocking deliverables.');
      }
      const burnoutMembers = analytics.memberWorkload.filter(w => w.burnoutRisk);
      if (burnoutMembers.length > 0) {
        doc.text(`- Workload imbalance detected: redistribute tasks from ${burnoutMembers.map(m => m.user.name).join(', ')}.`);
      }
      if (analytics.inactiveMembers.length > 0) {
        doc.text(`- Inactivity warning: check status updates for ${analytics.inactiveMembers.map(m => m.user.name).join(', ')}.`);
      }
      if (analytics.deadlineRisk === 'high') {
        doc.text('- Project timeline delay risk is High. Consider reassigning resources or reducing phase scopes.');
      }
      doc.text('- Maintain logs for documentation and review events to ensure accurate contribution analytics.');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateProjectReportPDF,
};

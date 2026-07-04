const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'task_create',
        'task_update',
        'task_delete',
        'task_complete',
        'member_join',
        'member_leave',
        'member_role_update',
        'comment_add',
        'comment_delete',
        'attachment_add',
        'attachment_delete',
        'github_import',
      ],
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Activity', ActivitySchema);

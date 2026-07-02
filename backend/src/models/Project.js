const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectRole: {
    type: String,
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a project title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['college', 'corporate', 'personal'],
      required: [true, 'Please select a category'],
    },
    deadline: {
      type: Date,
      required: [true, 'Please set a deadline'],
    },
    repoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [MemberSchema],
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'archived'],
      default: 'planning',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', ProjectSchema);

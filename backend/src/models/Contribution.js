const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['code', 'documentation', 'task', 'meeting', 'review', 'manual'],
      required: [true, 'Please add a contribution type'],
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
    },
    impactScore: {
      type: Number,
      required: [true, 'Please add an impact score'],
      min: [1, 'Impact score must be at least 1'],
      max: [10, 'Impact score cannot exceed 10'],
    },
    source: {
      type: String,
      enum: ['manual', 'github', 'docs', 'meeting'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Contribution', ContributionSchema);

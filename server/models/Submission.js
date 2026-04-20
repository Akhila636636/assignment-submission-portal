const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalized from assignment.createdBy for quick access control checks
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectTitle: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required'],
    },
    // Stored filename on disk (in uploads/ folder). Cleared on purge.
    pdfFilename: {
      type: String,
      default: null,
    },
    grade: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'graded', 'archived'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure one submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);

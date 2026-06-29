const mongoose = require('mongoose');

const SummarySchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  summary: { type: String },
  attempts: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
});

module.exports = mongoose.model('Summary', SummarySchema);

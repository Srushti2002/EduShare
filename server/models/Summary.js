const mongoose = require("mongoose");

const SummarySchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  playlistId: { type: mongoose.Schema.Types.ObjectId, ref: "Playlist", required: true },
  summary: { type: String },
  attempts: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },
});

SummarySchema.index({ videoId: 1, playlistId: 1 }, { unique: true });

module.exports = mongoose.model("Summary", SummarySchema);

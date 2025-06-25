const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    url: { 
        type: String, 
        required: true 
    },
    mentorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    videos: [
      {
        videoId: { type: String, required: true },
        title: { type: String, required: true },
        duration: { type: Number, required: true } // duration in seconds
      }
    ]

  },
  { timestamps: true }
);


module.exports = mongoose.model('Playlist', playlistSchema);
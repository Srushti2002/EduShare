const Playlist = require("../models/Playlist");
const User = require("../models/User");
const axios = require('axios');
const { getYouTubePlaylistVideosWithDurations } = require('../utils/youtube'); // Add this import
require('dotenv').config(); // This must be at the top
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const { summaryQueue } = require("../workers/summaryWorker");
const Summary = require("../models/Summary");
const { generateMCQsWithGemini } = require("../utils/summaryUtils");

// Add new playlist
const createPlaylist = async (req, res) => {
  const { title, description, url } = req.body;
  const mentorId = req.user.id;

  try {
    // Extract playlistId from URL
    const match = url.match(/[?&]list=([^&]+)/);
    if (!match) return res.status(400).json({ message: "Invalid playlist URL" });
    const playlistId = match[1];

    // Fetch video details (title, videoId, duration) from YouTube
    const videos = await getYouTubePlaylistVideosWithDurations(playlistId);
    if (!videos || videos.length === 0) {
      return res.status(400).json({ message: "No videos found in playlist or failed to fetch videos" });
    }


    const newPlaylist = new Playlist({ title, description, url, mentorId, videos });
    await newPlaylist.save();
    await Promise.all(videos.map(async (video) => {
    await Summary.create({
      videoId: video.videoId,
      playlistId: newPlaylist._id,
    });

    summaryQueue.add({ videoId: video.videoId, playlistId: newPlaylist._id });
  }));
    res.status(201).json(newPlaylist);

  } catch (err) {
    console.error("Error in createPlaylist:", err);
    res.status(500).json({ message: "Failed to create plalyist" });
  }
};


const getPlaylists = async (req, res) => {
  try {
    const { mentorId } = req.query;
    const filter = mentorId ? { mentorId } : { mentorId: req.user.id };
    const playlists = await Playlist.find(filter);
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ message: "Error fetching playlists" });
  }
};

// Update playlist
const updatePlaylist = async (req, res) => {
  const { id } = req.params;
  const { title, description, url } = req.body;

  try {
    const updated = await Playlist.findOneAndUpdate(
      { _id: id, mentorId: req.user.id },
      { title, description, url },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Playlist not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// Delete playlist
const deletePlaylist = async (req, res) => {
  const { id } = req.params;

  try {
    await Summary.deleteMany({ playlistId: id });

    await User.updateMany(
      { followingPlaylists: id },
      {
        $pull: { followingPlaylists: id },
        $unset: { [`playlistProgress.${id}`]: "", [`overallPlaylistProgress.${id}`]: "" }
      }
    );
    const deleted = await Playlist.findOneAndDelete({
      _id: id,
      mentorId: req.user.id,
    });
    if (!deleted) return res.status(404).json({ message: "Playlist not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ message: "Error fetching playlist" });
  }
};

// Fetch videos from a YouTube playlist
const getYoutubePlaylistVideos = async (req, res) => {
  try {
    const { id } = req.params; // MongoDB playlist _id
    const playlist = await Playlist.findById(id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const playlistUrl = playlist.url;
    const apiKey = process.env.YOUTUBE_API_KEY;

    // Extract playlistId from URL
    const match = playlistUrl.match(/[?&]list=([^&]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid playlist URL' });
    const playlistId = match[1];
    // console.log(playlistId);

    // Fetch videos from YouTube API
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/playlistItems`, {
        params: {
          part: 'snippet',
          maxResults: 50,
          playlistId,
          key: apiKey,
        }
      }
    );
    const videos = response.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.snippet.resourceId.videoId,
      thumbnail: item.snippet.thumbnails?.default?.url,
    }));
    res.json(videos);
  } catch (err) {
  console.error("YouTube API error:", err?.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

const getEnrolledPlaylists = async (req, res) => {
  try {
    const student = await User.findById(req.user.id)
      .populate('followingPlaylists');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }   
    res.json(student.followingPlaylists || []);
  }
  catch (err) {
    console.error("Error fetching enrolled playlists:", err);
    res.status(500).json({ error: 'Failed to fetch enrolled playlists' });
  }
};

const toggleEnrollPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.body;
    if (!playlistId) {
      return res.status(400).json({ error: "playlistId is required" });
    }
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const idx = student.followingPlaylists.findIndex(
      id => id.toString() === playlistId
    );

    let action;
    if (idx === -1) {
      // Not enrolled, so enroll
      student.followingPlaylists.push(playlistId);
      action = "enrolled";
    } else {
      // Already enrolled, so unenroll
      student.followingPlaylists.splice(idx, 1);
      action = "unenrolled";
    }

    await student.save();
    res.json({ message: `Successfully ${action} in playlist` });
  } catch (error) {
    console.error("Error in toggleEnrollPlaylist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getPlaylistEnrollmentStats = async (req, res) => {
  try {
    console.log("Fetching playlist enrollment stats...");
    const mentorId = req.user.id;
    console.log(mentorId);

    const playlists = await Playlist.find({mentorId});

    const stats = await Promise.all(
      playlists.map(async (playlist) => {
        const enrolledCount = await User.countDocuments({
          followingPlaylists: playlist._id
        });
        return {
          playlistId: playlist._id,
          title: playlist.title,
          enrolledCount
        };
      }))
      res.status(200).json(stats);
  }
  catch(err) {
    console.error("Error fetching playlist enrollment stats:", err);
    res.status(500).json({error: 'Failed to fetch playlist enrollment stats'})
  }

}

const generateMCQsForPlaylist = async (req, res) => {
  const { playlistId } = req.params;
  try {
    // Fetch all summaries for this playlist
    const summaries = await Summary.find({ playlistId });
    if (!summaries || summaries.length === 0) {
      return res.status(404).json({ error: "No summaries found for this playlist." });
    }

    // Combine all summaries into one text block
    const combinedSummary = summaries.map(s => s.summary).filter(Boolean).join("\n\n");

    // Generate MCQs using Gemini API
    if(!combinedSummary) {
      return res.status(404).json({ error: "No valid summaries found to generate MCQs." });
    } 
    
    const mcqs = await generateMCQsWithGemini(combinedSummary, 20);
    if (!mcqs) {
      return res.status(500).json({ error: "Failed to generate MCQs." });
    }

    res.json({ mcqs });
  } catch (err) {
    console.error("Error generating MCQs for playlist:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {createPlaylist, getPlaylists, updatePlaylist, 
  deletePlaylist, getPlaylistById, getYoutubePlaylistVideos,
  getEnrolledPlaylists, toggleEnrollPlaylist, getPlaylistEnrollmentStats,
   generateMCQsForPlaylist
};

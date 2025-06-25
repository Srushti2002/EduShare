const Playlist = require("../models/Playlist");
const axios = require('axios');
const User = require("../models/User");
const { getYouTubePlaylistVideosWithDurations } = require('../utils/youtube'); // Add this import
require('dotenv').config(); // This must be at the top


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
    res.status(201).json(newPlaylist);
  } catch (err) {
    console.error("Error in createPlaylist:", err);
    res.status(500).json({ message: "Failed to create plalyist" });
  }
};

// Get playlists for logged-in mentor
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

// const enrollInPlaylist = async (req, res) => {
//   try {
//     const { playlistId } = req.body;
//     if(!playlistId) {
//       return res.status(400).json({ error: 'Playlist ID is required' });
//     }

//     const student = await User.findById(req.user.id);
//     if(!student) {
//       return res.status(404).json({ error: 'Student not found' });
//     }
//     if(!student.followingPlaylists.includes(playlistId)) {
//       student.followingPlaylists.push(playlistId);
//       await student.save();
//     }
//     res.status(200).json({ message: 'Successfully enrolled in playlist' });
//   }
//   catch (err) {
//     console.error("Enrollment error:", err);
//     res.status(500).json({ error: 'Failed to enroll in playlist' });
//   }
// }

// const unenrollFromPlaylist = async (req, res) => {
//   try {
//     const { playlistId } = req.body;
//     if (!playlistId) {
//       return res.status(400).json({ error: "playlistId is required" });
//     }
//     const student = await User.findById(req.user.id);
//     if (!student) {
//       return res.status(404).json({ error: "Student not found" });
//     }
//     student.followingPlaylists = student.followingPlaylists.filter(
//       id => id.toString() !== playlistId
//     );
//     await student.save();
//     res.json({ message: "Unenrolled from playlist successfully" });
//   } catch (error) {
//     console.error("Error in unenrollFromPlaylist:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

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

module.exports = {createPlaylist, getPlaylists, updatePlaylist, 
  deletePlaylist, getPlaylistById, getYoutubePlaylistVideos,
  getEnrolledPlaylists, toggleEnrollPlaylist,};

const express = require('express');
const  {
  createPlaylist,
  getPlaylists,
  updatePlaylist,
  deletePlaylist,
  getYoutubePlaylistVideos,
  getPlaylistById,
  getEnrolledPlaylists,
  toggleEnrollPlaylist,
  getPlaylistEnrollmentStats,
  generateMCQsForPlaylist
} =  require("../controllers/playlistController");
const { jwtAuthMiddleware } = require("../middleware/jwt.js");

const router = express.Router();

router.post("/", jwtAuthMiddleware, createPlaylist);
router.get("/", jwtAuthMiddleware, getPlaylists);
router.put("/:id", jwtAuthMiddleware, updatePlaylist);
router.delete("/:id", jwtAuthMiddleware, deletePlaylist);
router.get('/youtube-videos/:id', jwtAuthMiddleware, getYoutubePlaylistVideos);
router.get("/enrolled", jwtAuthMiddleware, getEnrolledPlaylists);
router.get('/enrollmentStats', jwtAuthMiddleware, getPlaylistEnrollmentStats);
router.get('/:id', jwtAuthMiddleware, getPlaylistById);
router.post('/toggleEnroll', jwtAuthMiddleware, toggleEnrollPlaylist);
router.post('/:playlistId/generate-mcqs', jwtAuthMiddleware, generateMCQsForPlaylist);


module.exports = router;



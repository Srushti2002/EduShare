const express = require('express');
const  {
  createPlaylist,
  getPlaylists,
  updatePlaylist,
  deletePlaylist,
  getYoutubePlaylistVideos,
  getPlaylistById,
  getEnrolledPlaylists,
  toggleEnrollPlaylist
} =  require("../controllers/playlistController");
const { jwtAuthMiddleware } = require("../middleware/jwt.js");

const router = express.Router();

router.post("/", jwtAuthMiddleware, createPlaylist)
router.get("/", jwtAuthMiddleware, getPlaylists);

router.put("/:id", jwtAuthMiddleware, updatePlaylist)
router.delete("/:id", jwtAuthMiddleware, deletePlaylist);
router.get('/youtube-videos/:id', jwtAuthMiddleware, getYoutubePlaylistVideos);
router.get("/enrolled", jwtAuthMiddleware, getEnrolledPlaylists);
router.get('/:id', jwtAuthMiddleware, getPlaylistById);
// router.post("/enroll", jwtAuthMiddleware, enrollInPlaylist);
// router.post("/unenroll", jwtAuthMiddleware, unenrollFromPlaylist);
router.post('/toggleEnroll', jwtAuthMiddleware, toggleEnrollPlaylist);

module.exports = router;



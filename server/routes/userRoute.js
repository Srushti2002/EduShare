const express = require('express');
const { signUpUser, loginUser, getUserProfile, updateProfile, getMentors, 
    getFollowedMentors, updatePlaylistProgress, getPlaylistProgress, 
    toggleFollowMentor, calculateOverallProgress, getFollowersCount, deleteUser} = require('../controllers/userController');
const { jwtAuthMiddleware } = require("../middleware/jwt.js");

const router = express.Router();

router.post('/signup', signUpUser);
router.post('/login', loginUser);

router.get('/profile', jwtAuthMiddleware, getUserProfile);
router.get('/profile/:id', jwtAuthMiddleware, getUserProfile);
router.put('/profile', jwtAuthMiddleware, updateProfile);

router.get('/mentors', jwtAuthMiddleware, getMentors);
router.get('/progress/:playlistId', jwtAuthMiddleware, getPlaylistProgress);
router.get('/mentors/following', jwtAuthMiddleware, getFollowedMentors);
router.post('/mentors/toggleFollow', jwtAuthMiddleware, toggleFollowMentor);
router.post('/progress', jwtAuthMiddleware, updatePlaylistProgress);
router.get('/overallProgress', jwtAuthMiddleware, calculateOverallProgress);
router.get('/followersCount/:id', jwtAuthMiddleware, getFollowersCount);
router.get('/followersCount', jwtAuthMiddleware, getFollowersCount);
router.delete('/:id', jwtAuthMiddleware, deleteUser);

module.exports = router;

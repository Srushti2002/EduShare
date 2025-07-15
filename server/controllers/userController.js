const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Summary = require('../models/Summary');
const { generateToken} = require('../middleware/jwt');
const { getYouTubeVideoDuration } = require('../utils/youtube'); // Assuming you have a utility function to fetch video duration

const signUpUser = async(req, res) => {
    try {
        const {name, email, password, role, fields} = req.body;

        const user = await User.findOne({email});
        if(user) {
            return res.status(400).json({error: 'User already exist'});
        }

        const newUserData = { name, email, password, role };
        if (role === "mentor") {
            newUserData.fields = fields; // <-- only for mentors
        }

        const newUser = new User(newUserData);

        const response = await newUser.save();
        console.log("User data saved");

        const payload = {
            id : response._id
        };

        console.log(JSON.stringify(payload));
        const token = generateToken(payload);

        res.status(200).json({
            _id: response._id,
            name: response.name,
            email: response.email,
            role: response.role,
            fields: response.fields, // <-- only for mentors
            token: token,
        });
    }
    catch(error) {
        console.error('Error in signUpUser:', error);
        res.status(500).json({error: 'Internal server error'});
    }
}

const loginUser = async(req, res) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({error: 'Please enter all fieldss'});
        }

        const user = await User.findOne({email});

        if(!user || !(await user.comparePassword(password))) {
            return res.status(400).json({error: 'Invalid credentials'});
        }

        const payload = {
            id : user._id
        };

        const token = generateToken(payload);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            fields: user.fields, // <-- only for mentors
            role: user.role,
            token
            });
        }
    catch(error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({error: 'Internal server error'});
    }
    }


    const getUserProfile = async (req, res) => {
    try{
        const userId = req.params.id || req.user.id;
        const user = await User.findById(userId).select('-password');
        if(!user){
            return res.status(404).json({error: 'User not found'});
        }
        // Ensure overallProgress is always present for students
        
        res.json(user);
    }
    catch(error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({error: 'Internal server error'});
    }
}

const updateProfile = async (req, res) => {
    try {
        const {name, bio, gender, fields} = req.body;
        const user = await User.findById(req.user.id);
        if(!user) {
            return res.status(404).json({error: 'User not found'});
        }

        user.name = name || user.name;
        user.bio = bio || user.bio;
        user.gender = gender || user.gender;
        if (user.role === "mentor" && fields) {
            user.fields = fields;
        }
        await user.save();
        res.json(user);
    }

    catch(error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({error: 'Internal server error'});
    }
}

const getMentors = async (req, res) => {
    try {
        const search = req.query.search || '';
        const mentors = await User.find({
            role: "mentor",
            $or: [
                {name: { $regex: search, $options: "i"}},
                {fields: { $regex: search, $options: "i"}},
                {bio : {$regex: search, $options: "i"}}
            ]
        }).select('-password');
        res.json(mentors);
    }
    catch (error) {
        console.error('Error in getMentors:', error);
        res.status(500).json({error: 'Internal server error'});
    }
}

const getFollowedMentors = async (req, res) => {
    try {
        const student = await User.findById(req.user.id).populate('following', '-password');
        res.json(student.following);
    }
    catch (error) {
        console.error('Error in getFollowedMentors:', error);
        res.status(500).json({error: 'Internal server error'});
    }
}

const toggleFollowMentor = async (req, res) => {
  try {
    const { mentorId } = req.body;
    if (!mentorId) {
      return res.status(400).json({ error: 'mentorId is required' });
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student._id.equals(mentorId)) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== "mentor") {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const isFollowing = student.following.includes(mentorId);

    if (isFollowing) {
      // Unfollow
      student.following = student.following.filter(
        id => id.toString() !== mentorId
      );
      await student.save();
      return res.json({ message: "Unfollowed successfully" });
    } else {
      // Follow
      student.following.push(mentorId);
      await student.save();
      return res.json({ message: 'Successfully followed mentor' });
    }
  } catch (error) {
    console.error('Error in toggleFollowMentor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFollowersCount = async (req, res) => {
  try{
      const mentorId = req.params.id || req.user.id;
      // console.log(req.params.id, req.user.id);
      const count = await User.countDocuments({ following: mentorId});

      // console.log("Followers count for mentor", mentorId, "is", count); 
      res.json({ followersCount : count});
  }

  catch(err) {
    console.error("Error getting followers count:", err);
    res.status(500).json({ message: "Failed to fetch followers count"});
  }
}

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // If mentor: delete all their playlists and remove from students' following
        if (user.role === "mentor") {
      // Find all playlists by this mentor
      const playlists = await Playlist.find({ mentorId: user._id });
      const playlistIds = playlists.map(p => p._id);

      // Delete all playlists by this mentor
      await Playlist.deleteMany({ mentorId: user._id });

      // Delete all summaries for these playlists
      await Summary.deleteMany({ playlistId: { $in: playlistIds } });

      // Remove these playlists from students' followingPlaylists and progress
      await User.updateMany(
        { followingPlaylists: { $in: playlistIds } },
        {
          $pull: { followingPlaylists: { $in: playlistIds } },
          $unset: playlistIds.reduce((acc, pid) => ({
            ...acc,
            [`playlistProgress.${pid}`]: "",
            [`overallPlaylistProgress.${pid}`]: ""
          }), {})
        }
      );

            // Remove mentor from all students' following arrays
      await User.updateMany(
        { following: user._id },
        { $pull: { following: user._id } }
      );
    }

    // If student: remove from all mentors' followers
    if (user.role === "student") {
      // Remove student from all mentors' followers
      await User.updateMany(
        { role: "mentor" },
        { $pull: { followers: user._id } }
      );
    }

    // Finally, delete the user
    await user.deleteOne();

    res.json({ message: "User and related data deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updatePlaylistProgress = async (req, res) => {
  try {
    const { playlistId, progress, overallPlaylistProgress } = req.body;
    if (!playlistId || typeof progress !== "object") {
      return res.status(400).json({ error: "playlistId and progress object are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.role !== "student") {
      return res.status(403).json({ error: "Only students can update playlist progress" });
    }

    
    // --- Max logic for playlistProgress ---
    const prevProgressObj = user.playlistProgress.get(playlistId) || {};
    // Merge: for each videoId, keep the max percent
    const mergedProgress = { ...prevProgressObj };
    for (const [videoId, percent] of Object.entries(progress)) {
      mergedProgress[videoId] = Math.max(
        typeof mergedProgress[videoId] === "number" ? mergedProgress[videoId] : 0,
        typeof percent === "number" ? percent : 0
      );
    }
    user.playlistProgress.set(playlistId, mergedProgress);

    // --- Max logic for overallPlaylistProgress ---
    if (typeof overallPlaylistProgress === "number") {
      const prevOverall = user.overallPlaylistProgress.get(playlistId.toString());
      const maxOverall = Math.max(
        typeof prevOverall === "number" ? prevOverall : 0,
        overallPlaylistProgress
      );
      user.overallPlaylistProgress.set(playlistId.toString(), maxOverall);
    }


    await user.save();

    res.json({
      message: "Progress updated",
      playlistProgress: user.playlistProgress,
      overallPlaylistProgress: user.overallPlaylistProgress,
      overallProgress: user.overallProgress,
    });
  } catch (error) {
    console.error("Error in updatePlaylistProgress:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getPlaylistProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") return res.status(403).json({ error: "Unauthorized" });
    const progress = user.playlistProgress.get(req.params.playlistId) || {};
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const calculateOverallProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'student') {
      return res.status(400).json({ message: "User not found or not a student" });
    }

    const progressMap = user.overallPlaylistProgress;
    const enrolledPlaylists = user.followingPlaylists.map(id => id.toString());

    // Get progress for each enrolled playlist, default to 0 if missing
    const progressValues = enrolledPlaylists.map(playlistId => {
      const progress = progressMap.get(playlistId);
      return typeof progress === 'number' ? progress : 0;
    });

    console.log("Progress Map is ")

    // Check if any progress has been made
    const hasProgress = progressValues.some(val => val > 0);

    if (!hasProgress) {
      user.overallProgress = 0;
    } else {
      const total = progressValues.reduce((a, b) => a + b, 0);
      user.overallProgress = total / progressValues.length;
    }

    await user.save();
    res.json({ overallProgress: user.overallProgress });
  } catch (error) {
    console.error("Error calculating overall progress:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {signUpUser, loginUser, getUserProfile, 
    updateProfile, getMentors, getFollowedMentors, 
    // followMentor, unfollowMentor,
    toggleFollowMentor,
    updatePlaylistProgress, getPlaylistProgress, deleteUser,
    calculateOverallProgress, getFollowersCount};

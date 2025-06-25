const User = require('../models/User');
const Playlist = require('../models/Playlist');
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

    user.playlistProgress.set(playlistId, progress); // progress is an object: { videoId: percent, ... }
    
    // Save the overallPlaylistProgress sent from the frontend
    if (typeof overallPlaylistProgress === "number") {
      user.overallPlaylistProgress.set(playlistId, overallPlaylistProgress);
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

// Calculate overall progress for a student based on time watched across all enrolled playlists
const calculateOverallProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get all playlist progress for this user
    const progressMap = user.overallPlaylistProgress;
    if (!progressMap || progressMap.size === 0) {
      user.overallProgress = 0;
      await user.save();
      return res.json({ overallProgress: 0 });
    }

    let total = 0;
    let playlistCount = user.followingPlaylists.length;

    // For each playlist the user has progress in
    for (const [playlistId, playlistProgress] of progressMap.entries()) {
      total += playlistProgress; 
    }

    user.overallProgress = total / playlistCount;
    await user.save();
    console.log("Overall progress calculated:", user.overallProgress);
    res.json({ overallProgress: user.overallProgress });
  } catch (error) {
    console.error("Error in calculateOverallProgress:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



module.exports = {signUpUser, loginUser, getUserProfile, 
    updateProfile, getMentors, getFollowedMentors, 
    // followMentor, unfollowMentor,
    toggleFollowMentor,
    updatePlaylistProgress, getPlaylistProgress, calculateOverallProgress};

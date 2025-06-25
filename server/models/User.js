const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['mentor', 'student'],
        required: true
    },
    fields: {
        type: [String],
        enum: [
            "Web Development",
            "Data Science",
            "AI",
            "Cloud",
            "Mobile Development",
            "Cybersecurity",
            "DevOps",
            "UI/UX",
            "Other"
        ],
        required: function() { return this.role === 'mentor'; },
        default: []
    },
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  followingPlaylists: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Playlist"
  }
],

playlistProgress: {
  type: Map,
  of: Object, // <-- change this!
  default: {},
  required: function() { return this.role === 'student'; }
},

overallPlaylistProgress: {
  type: Map,
  of: Number, // stores percentage (0-100) for each playlistId
  default: {},
  required: function() { return this.role === 'student'; }
},

overallProgress: {
  type: Number,
  default: 0, // percentage (0-100)
  required: function() { return this.role === 'student'; }
},
    
    bio: { 
        type: String 
    },

    gender: { 
        type: String, 
        enum: ['male', 'female', 'other'] ,
        default: 'other'
    }
});

userSchema.pre('save', async function(next) {
    const user = this;

    if(!user.isModified('password')) {
        return next();
    }  
    
    try {
        const salt = await bcrypt.genSalt(10);
        
        const hashedPassword = await bcrypt.hash(user.password, salt);

        this.password = hashedPassword;
    }
    catch(error) {
        return next(error);
    }
});

userSchema.methods.comparePassword = async function(userPwd) {
    try {
        const isMatch =  await bcrypt.compare(userPwd, this.password);
        return isMatch;
    }
    catch(error) {
        throw new Error(error);
    }
}
module.exports = mongoose.model('User', userSchema);
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    nativeLanguage: {
      type: String,
      default: "",
    },
    learningLanguage: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['student', 'parent', 'faculty', 'admin'],
      default: 'student',
    },

    // COCOON-Specific Fields for Child Safety & Education
    age: {
      type: Number,
      min: 5,
      max: 18,
      default: null,
    },
    grade: {
      type: String,
      enum: ['kindergarten', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', 'college'],
      default: null,
    },
    school: {
      type: String,
      default: "",
    },
    interests: [{
      type: String,
      default: [],
    }],
    learningGoals: {
      type: String,
      default: "",
    },

    // Safety & Monitoring Settings
    safetyLevel: {
      type: String,
      enum: ['strict', 'moderate', 'relaxed'],
      default: 'moderate',
    },
    allowedTopics: [{
      type: String,
      enum: ['education', 'gaming', 'sports', 'music', 'art', 'science', 'math', 'literature', 'social'],
      default: ['education', 'sports', 'music', 'art', 'science', 'math', 'literature'],
    }],
    restrictedTopics: [{
      type: String,
      default: [],
    }],
    communicationPreferences: {
      allowDirectMessages: {
        type: Boolean,
        default: true,
      },
      allowGroupChats: {
        type: Boolean,
        default: true,
      },
      allowFileSharing: {
        type: Boolean,
        default: false,
      },
      allowVideoCalls: {
        type: Boolean,
        default: false,
      },
    },

    // Parent Monitoring Settings
    monitoringSettings: {
      aiAnalysisEnabled: {
        type: Boolean,
        default: true,
      },
      realTimeAlerts: {
        type: Boolean,
        default: true,
      },
      weeklyReports: {
        type: Boolean,
        default: true,
      },
      contentFiltering: {
        type: Boolean,
        default: true,
      },
    },

    // Educational Progress Tracking
    academicSubjects: [{
      type: String,
      enum: ['math', 'science', 'english', 'history', 'geography', 'art', 'music', 'physical_education', 'computer_science'],
      default: [],
    }],
    currentCourses: [{
      type: String,
      default: [],
    }],
    learningStreak: {
      type: Number,
      default: 0,
    },
    totalStudyTime: {
      type: Number, // in minutes
      default: 0,
    },

    // Emergency Contact Information (for parents)
    emergencyContact: {
      name: {
        type: String,
        default: "",
      },
      relationship: {
        type: String,
        default: "",
      },
      phone: {
        type: String,
        default: "",
      },
      email: {
        type: String,
        default: "",
      },
    },

    // Time Management & Screen Time
    dailyScreenTimeLimit: {
      type: Number, // in minutes
      default: 120, // 2 hours default
    },
    preferredStudyTimes: [{
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: ['afternoon', 'evening'],
    }],

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Parent-child relationships
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Secure linking system
    linkedAccounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    linkCode: {
      type: String,
      default: null,
    },
    linkCodeExpires: {
      type: Date,
      default: null,
    },

    // User preferences
    theme: {
      type: String,
      enum: [
        'light', 'dark', 'night', 'cupcake', 'forest', 'bumblebee', 'emerald',
        'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween',
        'garden', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
        'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
        'coffee', 'winter', 'dim', 'nord', 'sunset'
      ],
      default: 'night',
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // Generate Profile Avatar if not set
  if (!this.profilePic || this.profilePic.trim() === "") {
    const name = this.fullName || "User";
    this.profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  }

  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  const isPasswordCorrect = await bcrypt.compare(enteredPassword, this.password);
  return isPasswordCorrect;
};

const User = mongoose.model("User", userSchema);

export default User;

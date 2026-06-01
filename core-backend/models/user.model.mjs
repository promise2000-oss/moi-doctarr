import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  appleId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  userName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  demographics: {
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    age: {
      type: String,
    },
    currentCondition: {
      type: String,
    },
    bloodType: {
      type: String,
    },
    country: {
      type: String,
    },
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    unique: true,
    sparse: true,
  },
  verificationCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlacklisted: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  preference: {
    emailNotification: {
      type: Boolean,
      default: true,
    },
    smsAlert: {
      type: Boolean,
      default: false,
    },
    twoFactorAuth: {
      type: Boolean,
      default: true,
    },
  },
  notifications: [
    {
      message: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  medications: [
    {
      id: {
        type: String,
      },
      name: {
        type: String,
      },
      dosage: {
        type: String,
      },
      time: {
        type: String,
      },
      frequent: {
        type: String,
        enum: ["morning", "afternoon", "night"],
      },
      supply: {
        type: String,
      },
      status: {
        type: Boolean,
        default: false,
      },
      startedAt: {
        type: Date,
        default: Date.now,
      },
      stoppedAt: {
        type: Date,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model("User", userSchema);

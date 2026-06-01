import mongoose from "mongoose";

const triageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  symptoms: [
    {
      type: String,
      required: true,
    },
  ],
  duration: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ["Mild", "Moderate", "Severe"],
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },

  triageStatus: {
    level: {
      type: String,
      enum: ["Emergency", "Urgent", "Non-Urgent"],
      required: true,
    },
  },
  actionPlan: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Triage = mongoose.model("Triage", triageSchema);

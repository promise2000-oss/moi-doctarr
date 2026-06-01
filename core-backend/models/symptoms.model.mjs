import mongoose from "mongoose";

const symptomLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  symptomName: {
    type: String,
    required: true,
    trim: true,
  },
  severity: {
    type: Number,
    min: 1,
    max: 10,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

export const SymptomLog = mongoose.model("SymptomLog", symptomLogSchema);

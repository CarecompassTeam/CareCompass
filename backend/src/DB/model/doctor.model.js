import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialty: {
      type: String,
      required: true,
    },
    licenseNo: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false,
    validateBeforeSave: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
  },
);

export const DoctorModel = mongoose.models.doctor || mongoose.model("Doctor", doctorSchema);
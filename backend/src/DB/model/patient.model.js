import mongoose from "mongoose";
import { GenderEnum } from "../../common/enum/user.enum.js";

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
      gender: {
        type: Number,
        enum: Object.values(GenderEnum),
        default: GenderEnum.MALE,
      },
    phone: {
      type: String,
      required: true,
    },
    assignedDoctor: {
      type: mongoose.Types.ObjectId,
      ref: "Doctor",
      default: null,
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

export const PatientModel =mongoose.models.patient || mongoose.model("Patient", patientSchema);
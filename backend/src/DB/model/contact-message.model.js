import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 50,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      minLength: 5,
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

export const ContactMessageModel =mongoose.models.contactMessage ||mongoose.model(
  "ContactMessage",
  contactMessageSchema,
);
import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "./../../common/enum/user.enum.js";
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: function(){
        return this.provider == ProviderEnum.SYSTEM
      },
    },
    phone: {
      type: String,
      required:true
    },
    confirmEmail: Date,
    image: String,
    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.PATIENT,
    },
    provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.SYSTEM,
    },
    changeCredentialsTime:Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
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

userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

export const UserModel = mongoose.models.user || mongoose.model("User", userSchema);
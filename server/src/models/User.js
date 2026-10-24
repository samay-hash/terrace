import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = ["customer", "admin"];
const BCRYPT_COST = 12;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // Never selected by default, so it cannot leak through a careless query.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "customer", index: true },
    // Bumped to invalidate every issued session for this user.
    tokenVersion: { type: Number, default: 0, select: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.tokenVersion;
        return ret;
      },
    },
  },
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, BCRYPT_COST);
};

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// A real hash to compare against when the email is unknown, so a failed login
// takes the same time whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync("terrace-timing-equaliser", BCRYPT_COST);
userSchema.statics.burnPasswordCheck = function burnPasswordCheck(plain) {
  return bcrypt.compare(plain, DUMMY_HASH);
};

export const User = mongoose.model("User", userSchema);

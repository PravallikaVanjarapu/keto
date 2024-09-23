import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'EXM', 'TTK', 'NEU', 'OTHERS', 'EXIDE', 'WEC', 'LG9','RED']
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = new mongoose.model("User",userSchema,"users");

export default User;

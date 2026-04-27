import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    location: { type: String, default: "" },
    ownerId: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

const Theater = mongoose.model("Theater", theaterSchema);
export default Theater;

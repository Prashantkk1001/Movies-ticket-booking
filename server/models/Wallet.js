import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;

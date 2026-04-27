import mongoose from "mongoose";

const cancellationRequestSchema = new mongoose.Schema(
  {
    booking: { type: String, required: true, ref: "Booking" },
    user: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

const CancellationRequest = mongoose.model(
  "CancellationRequest",
  cancellationRequestSchema,
);

export default CancellationRequest;

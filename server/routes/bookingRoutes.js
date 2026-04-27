import express from "express";
import {
  createBooking,
  createPaymentOrderForBooking,
  getOccupiedSeats,
  verifyRazorpayPayment,
  payWithWallet,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", createBooking);
bookingRouter.post("/verify-payment", verifyRazorpayPayment);
bookingRouter.post("/pay/:bookingId", createPaymentOrderForBooking);
bookingRouter.post("/pay-with-wallet/:bookingId", payWithWallet);
bookingRouter.get("/seats/:showId", getOccupiedSeats);

export default bookingRouter;

import express from "express";
import {
  createCancellationRequest,
  getFavorites,
  getUserBookings,
  getUserRole,
  updateFavorite,
  getWalletBalance,
} from "../controllers/UserController.js";

const userRouter = express.Router();

userRouter.get("/bookings", getUserBookings);
userRouter.post("/cancellation-request/:bookingId", createCancellationRequest);
userRouter.post("/update-favorite", updateFavorite);
userRouter.get("/favorites", getFavorites);
userRouter.get("/wallet", getWalletBalance);
userRouter.get("/role", getUserRole);

export default userRouter;

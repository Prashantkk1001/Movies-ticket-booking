import express from "express";
import {
  addTheaterShow,
  addTheater,
  deleteTheaterShow,
  getTheaters,
  getTheaterBookings,
  getTheaterDashboard,
  getTheaterProfile,
  getTheaterShows,
  deleteTheater,
} from "../controllers/theaterController.js";
import { requireAuth } from "@clerk/express";
import { protectTheater } from "../middleware/auth.js";

const theaterRouter = express.Router();

// Public route to get all theaters
theaterRouter.get("/all", getTheaters);

// Admin routes
theaterRouter.post("/add", requireAuth(), addTheater);
theaterRouter.post("/delete/:id", requireAuth(), deleteTheater);

// Theater owner routes
theaterRouter.get("/me", protectTheater, getTheaterProfile);
theaterRouter.get("/dashboard", protectTheater, getTheaterDashboard);
theaterRouter.get("/shows", protectTheater, getTheaterShows);
theaterRouter.post("/add-show", protectTheater, addTheaterShow);
theaterRouter.delete("/delete-show/:showId", protectTheater, deleteTheaterShow);
theaterRouter.get("/bookings", protectTheater, getTheaterBookings);

export default theaterRouter;

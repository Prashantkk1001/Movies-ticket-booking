import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import {
  approveCancellationRequest,
  deleteShow,
  getAllBookings,
  getCancellationRequests,
  getAllShows,
  getDashboardData,
  isAdmin,
} from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get("/is-admin", protectAdmin, isAdmin);
adminRouter.get("/dashboard", protectAdmin, getDashboardData);
adminRouter.get("/all-shows", protectAdmin, getAllShows);
adminRouter.get("/all-bookings", protectAdmin, getAllBookings);
adminRouter.get("/cancellation-requests", protectAdmin, getCancellationRequests);
adminRouter.post(
  "/cancellation-requests/:requestId/approve",
  protectAdmin,
  approveCancellationRequest,
);
adminRouter.delete("/shows/:showId", protectAdmin, deleteShow);

export default adminRouter;

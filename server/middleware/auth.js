import { getAuth, clerkClient } from "@clerk/express";
import Theater from "../models/Theater.js";

export const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    // ❗ Check user login
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    // ❗ Check admin role safely
    if (user?.privateMetadata?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not Admin",
      });
    }

    next();
  } catch (error) {
    console.log("Admin Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const protectTheater = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await clerkClient.users.getUser(userId);
    if (user?.privateMetadata?.role !== "theater") {
      return res.status(403).json({
        success: false,
        message: "Not Theater Owner",
      });
    }

    const theater = await Theater.findOne({ ownerId: userId });
    if (!theater) {
      return res.status(404).json({
        success: false,
        message: "No theater assigned to this account.",
      });
    }

    req.userId = userId;
    req.theaterId = theater._id;
    req.theater = theater;
    next();
  } catch (error) {
    console.log("Theater Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
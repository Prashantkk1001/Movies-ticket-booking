import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import CancellationRequest from "../models/CancellationRequest.js";
import Wallet from "../models/Wallet.js";
import { clerkClient } from "@clerk/express";

//API to check if user is admin

export const isAdmin = async (req, res) => {
  res.json({ success: true, isAdmin: true });
};

//API to get Dashboard Data

export const getDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });
    const activeShows = await Show.find({
      showDateTime: { $gte: new Date() },
    }).populate("movie");

    const totalUser = await User.countDocuments();

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
      activeShows,
      totalUser,
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API To get all shows
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie theater")
      .sort({ showDateTime: 1 });
    res.json({ success: true, shows });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete/cancel a show
export const deleteShow = async (req, res) => {
  try {
    const { showId } = req.params;

    const deletedShow = await Show.findByIdAndDelete(showId);
    if (!deletedShow) {
      return res.json({ success: false, message: "Show not found." });
    }

    // Remove linked bookings so admin data stays consistent.
    await Booking.deleteMany({ show: showId });

    res.json({ success: true, message: "Show deleted successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API To get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true })
      .populate({
        path: "show",
        populate: [
          { path: "movie" },
          { path: "theater" }
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    const userIds = [...new Set(bookings.map((b) => b.user).filter(Boolean))];

    const clerkUsersMap = {};
    if (userIds.length > 0) {
      const { data: clerkUsers } = await clerkClient.users.getUserList({
        userId: userIds,
      });
      clerkUsers.forEach((u) => {
        clerkUsersMap[u.id] = {
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.emailAddresses[0]?.emailAddress,
          email: u.emailAddresses[0]?.emailAddress,
        };
      });
    }

    const bookingsWithUsers = bookings.map((b) => ({
      ...b,
      user: clerkUsersMap[b.user] || b.user,
    }));

    res.json({ success: true, bookings: bookingsWithUsers });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getCancellationRequests = async (req, res) => {
  try {
    const requests = await CancellationRequest.find({})
      .populate({
        path: "booking",
        populate: { 
          path: "show", 
          populate: [
            { path: "movie" },
            { path: "theater" }
          ] 
        },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const approveCancellationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await CancellationRequest.findById(requestId);

    if (!request) {
      return res.json({ success: false, message: "Request not found." });
    }

    if (request.status !== "pending") {
      return res.json({ success: false, message: "Request already reviewed." });
    }

    const booking = await Booking.findById(request.booking);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found." });
    }

    const show = await Show.findById(booking.show);
    if (show) {
      booking.bookedSeats.forEach((seat) => {
        delete show.occupiedSeats[seat];
      });
      show.markModified("occupiedSeats");
      await show.save();
    }

    await Wallet.findOneAndUpdate(
      { user: booking.user },
      { $inc: { balance: booking.amount } },
      { upsert: true, new: true },
    );

    booking.isCancelled = true;
    booking.cancellationStatus = "approved";
    await booking.save();

    request.status = "approved";
    request.reviewedAt = new Date();
    await request.save();

    res.json({ success: true, message: "Cancellation approved and refunded." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

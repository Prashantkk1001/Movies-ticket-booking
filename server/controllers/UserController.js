import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import CancellationRequest from "../models/CancellationRequest.js";
import Wallet from "../models/Wallet.js";

//API Controller Function to Get User Bookings

export const getUserBookings = async (req, res) => {
  try {
    const user = req.auth().userId;

    const bookings = await Booking.find({ user })
      .populate({
        path: "show",
        populate: [
          { path: "movie" },
          { path: "theater" }
        ],
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const createCancellationRequest = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate("show");
    if (!booking || booking.user !== userId) {
      return res.json({ success: false, message: "Booking not found." });
    }

    if (!booking.isPaid || booking.isCancelled) {
      return res.json({
        success: false,
        message: "Only active paid bookings can be cancelled.",
      });
    }

    if (!booking.show?.showDateTime) {
      return res.json({ success: false, message: "Show details not found." });
    }

    const showStartTime = new Date(booking.show.showDateTime).getTime();
    const fiveHours = 5 * 60 * 60 * 1000;
    if (showStartTime - Date.now() < fiveHours) {
      return res.json({
        success: false,
        message: "Cancellation is allowed only 5+ hours before show time.",
      });
    }

    if (booking.cancellationStatus === "requested") {
      return res.json({
        success: false,
        message: "Cancellation request already submitted.",
      });
    }

    if (booking.cancellationStatus === "approved" || booking.isCancelled) {
      return res.json({ success: false, message: "Booking already cancelled." });
    }

    await CancellationRequest.create({
      booking: booking._id.toString(),
      user: userId,
      amount: booking.amount,
      status: "pending",
    });

    booking.cancellationStatus = "requested";
    await booking.save();

    res.json({
      success: true,
      message: "Cancellation request sent to admin.",
    });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

//API Controller Function to update Favorite Movie in clerk User Metadata

export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.auth().userId;

    const user = await clerkClient.users.getUser(userId);

    if (!user.privateMetadata.favorites) {
      user.privateMetadata.favorites = [];
    }
    if (!user.privateMetadata.favorites.includes(movieId)) {
      user.privateMetadata.favorites.push(movieId);
    } else {
      user.privateMetadata.favorites = user.privateMetadata.favorites.filter(
        (item) => item !== movieId
      );
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: user.privateMetadata,
    });

    res.json({ success: true, message: "Favorite movies Updated." });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.auth().userId);
    const favorites = user.privateMetadata.favorites;

    //Getting Movies Frome Database
    const movies = await Movie.find({ _id: { $in: favorites } });
    res.json({ success: true, movies });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getWalletBalance = async (req, res) => {
  try {
    const user = req.auth().userId;
    const wallet = await Wallet.findOne({ user });
    
    res.json({ success: true, balance: wallet ? wallet.balance : 0 });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getUserRole = async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.auth().userId);
    const role = user?.privateMetadata?.role || "user";

    return res.json({ success: true, role });
  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
};

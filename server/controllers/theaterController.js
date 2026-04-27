import Theater from "../models/Theater.js";
import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import { clerkClient } from "@clerk/express";

// Add Theater (Admin)
export const addTheater = async (req, res) => {
  try {
    const { name, location = "", ownerId = null } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Theater name is required" });
    }

    const exists = await Theater.findOne({ name });
    if (exists) {
      return res.json({ success: false, message: "Theater already exists" });
    }

    const theater = new Theater({ name, location, ownerId });
    await theater.save();

    res.json({ success: true, message: "Theater added successfully", theater });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Get All Theaters
export const getTheaters = async (req, res) => {
  try {
    const theaters = await Theater.find({}).sort({ createdAt: -1 });
    res.json({ success: true, theaters });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Theater (Admin)
export const deleteTheater = async (req, res) => {
  try {
    const { id } = req.params;
    await Theater.findByIdAndDelete(id);
    res.json({ success: true, message: "Theater deleted successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getTheaterProfile = async (req, res) => {
  try {
    return res.json({
      success: true,
      isTheater: true,
      theater: req.theater,
      theaterId: req.theaterId,
    });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

export const getTheaterDashboard = async (req, res) => {
  try {
    const theaterId = req.theaterId;

    const shows = await Show.find({ theaterId });
    const bookings = await Booking.find({ theaterId, isPaid: true });

    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);

    return res.json({
      success: true,
      data: {
        totalShows: shows.length,
        totalBookings: bookings.length,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

export const getTheaterShows = async (req, res) => {
  try {
    const shows = await Show.find({ theaterId: req.theaterId })
      .populate("movie theater")
      .sort({ showDateTime: 1 });
    return res.json({ success: true, shows });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

export const addTheaterShow = async (req, res) => {
  try {
    const { movieId, showTime, price } = req.body;
    const theaterId = req.theaterId;

    if (!movieId || !showTime || price === undefined) {
      return res.json({
        success: false,
        message: "movieId, showTime and price are required.",
      });
    }

    let movie = await Movie.findById(movieId);

    if (!movie) {
      const movieResponse = await fetch(`https://api.themoviedb.org/3/movie/${movieId}`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      });

      if (!movieResponse.ok) {
        return res.json({ success: false, message: "Movie not found in TMDB." });
      }

      const movieData = await movieResponse.json();

      movie = await Movie.create({
        _id: movieId,
        title: movieData.title,
        overview: movieData.overview,
        poster_path: movieData.poster_path,
        backdrop_path: movieData.backdrop_path,
        genres: movieData.genres || [],
        casts: [],
        release_date: movieData.release_date,
        original_language: movieData.original_language,
        tagline: movieData.tagline || "",
        vote_average: movieData.vote_average || 0,
        runtime: movieData.runtime || 0,
      });
    }

    const show = await Show.create({
      movie: movieId,
      theater: theaterId,
      theaterId,
      showDateTime: new Date(showTime),
      showPrice: Number(price),
      occupiedSeats: {},
    });

    return res.json({ success: true, message: "Show added successfully.", show });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

export const deleteTheaterShow = async (req, res) => {
  try {
    const { showId } = req.params;
    const theaterId = req.theaterId;

    const show = await Show.findOneAndDelete({ _id: showId, theaterId });
    if (!show) {
      return res.json({
        success: false,
        message: "Show not found for this theater.",
      });
    }

    await Booking.deleteMany({ show: showId, theaterId });
    return res.json({ success: true, message: "Show deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

export const getTheaterBookings = async (req, res) => {
  try {
    const theaterId = req.theaterId;

    const bookings = await Booking.find({ theaterId })
      .populate({
        path: "show",
        populate: [{ path: "movie" }, { path: "theater" }],
      })
      .sort({ createdAt: -1 })
      .lean();

    const userIds = [...new Set(bookings.map((booking) => booking.user).filter(Boolean))];
    const userMap = {};

    if (userIds.length > 0) {
      const { data: users } = await clerkClient.users.getUserList({ userId: userIds });
      users.forEach((user) => {
        userMap[user.id] =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.emailAddresses?.[0]?.emailAddress ||
          "User";
      });
    }

    const formattedBookings = bookings.map((booking) => ({
      ...booking,
      userName: userMap[booking.user] || booking.user,
    }));

    return res.json({ success: true, bookings: formattedBookings });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

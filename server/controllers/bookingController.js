import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Wallet from "../models/Wallet.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Function to check availability of selected seats for a movie

const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats;

    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (error) {
    console.error(error.message);
    return false;
  }
};

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are missing in server environment.");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createRazorpayOrder = async (bookingData) => {
  const razorpayInstance = getRazorpayInstance();
  const order = await razorpayInstance.orders.create({
    amount: Math.floor(bookingData.amount * 100),
    currency: "INR",
    receipt: bookingData._id.toString(),
    notes: { bookingId: bookingData._id.toString() },
  });

  bookingData.paymentLink = order.id;
  await bookingData.save();

  return order;
};

export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { showId, selectedSeats } = req.body;

    //check if the seats are available for the selected show

    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected seats are not available.",
      });
    }

    //Get the show dettails
    const showData = await Show.findById(showId).populate("movie");

    //create a new booking
    const bookingData = await Booking.create({
      user: userId,
      show: showId,
      theaterId: showData.theaterId || showData.theater,
      // amount: showData.price * selectedSeats.length,
      amount: (showData.showPrice || 0) * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    selectedSeats.map((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");

    await showData.save();

    const order = await createRazorpayOrder(bookingData);

    // Run Inngest Sheduler Function to check payment status after 10 minutes

    try {
      await inngest.send({
        name: "app/checkpayment",
        data: {
          bookingId: bookingData._id.toString(),
        },
      });
    } catch (inngestError) {
      console.error("Inngest enqueue failed (checkpayment):", inngestError.message);
    }

    res.json({
      success: true,
      bookingId: bookingData._id,
      amount: bookingData.amount,
      razorpayOrderId: order.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      currency: order.currency,
    });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const createPaymentOrderForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.auth().userId;

    const bookingData = await Booking.findById(bookingId).populate({
      path: "show",
      populate: { path: "movie" },
    });

    if (!bookingData || bookingData.user !== userId) {
      return res.json({ success: false, message: "Booking not found." });
    }

    if (bookingData.isPaid) {
      return res.json({ success: false, message: "Booking already paid." });
    }

    const order = await createRazorpayOrder(bookingData);

    res.json({
      success: true,
      bookingId: bookingData._id,
      amount: bookingData.amount,
      razorpayOrderId: order.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      currency: order.currency,
      movieTitle: bookingData.show?.movie?.title,
    });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.json({ success: false, message: "Missing payment details." });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.json({ success: false, message: "Payment verification failed." });
    }

    const bookingData = await Booking.findById(bookingId);
    if (!bookingData) {
      return res.json({ success: false, message: "Booking not found." });
    }
    if (bookingData.user !== userId) {
      return res.json({ success: false, message: "Unauthorized request." });
    }

    bookingData.isPaid = true;
    bookingData.paymentLink = "";
    await bookingData.save();

    try {
      await inngest.send({
        name: "app/show.booked",
        data: { bookingId },
      });
    } catch (inngestError) {
      console.error("Inngest enqueue failed (show.booked):", inngestError.message);
    }

    res.json({ success: true, message: "Payment successful." });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    const occupiedSeats = Object.keys(showData.occupiedSeats);
    res.json({ success: true, occupiedSeats });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const payWithWallet = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const { bookingId } = req.params;

    const bookingData = await Booking.findById(bookingId).populate({
      path: "show",
      populate: { path: "movie" },
    });

    if (!bookingData || bookingData.user !== userId) {
      return res.json({ success: false, message: "Booking not found." });
    }

    if (bookingData.isPaid) {
      return res.json({ success: false, message: "Booking already paid." });
    }

    const wallet = await Wallet.findOne({ user: userId });
    const walletBalance = wallet ? wallet.balance : 0;

    if (walletBalance < bookingData.amount) {
      return res.json({ success: false, message: "Insufficient wallet balance." });
    }

    wallet.balance -= bookingData.amount;
    await wallet.save();

    bookingData.isPaid = true;
    bookingData.paymentLink = "";
    await bookingData.save();

    try {
      await inngest.send({
        name: "app/show.booked",
        data: { bookingId },
      });
    } catch (inngestError) {
      console.error("Inngest enqueue failed (show.booked):", inngestError.message);
    }

    return res.json({ success: true, message: "Payment successful via Wallet." });
  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
};

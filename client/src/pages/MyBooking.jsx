import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFormat";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const MyBooking = () => {
  const currency = import.meta.env.VITE_CURRENCY;

  const { axios, getToken, user, image_base_url } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  
  // Payment Modal States
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const selectedBooking = bookings.find(
    (booking) => booking._id === selectedTicketId && booking.isPaid && !booking.isCancelled,
  );

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/user/bookings", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const openPaymentModal = async (booking) => {
    setPaymentModalBooking(booking);
    setIsWalletLoading(true);
    try {
      const { data } = await axios.get("/api/user/wallet", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setWalletBalance(data.balance);
      }
    } catch (error) {
      console.log("Error fetching wallet balance:", error);
    }
    setIsWalletLoading(false);
  };

  const handleWalletPayment = async (bookingId) => {
    try {
      const { data } = await axios.post(
        `/api/booking/pay-with-wallet/${bookingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        toast.success(data.message);
        setPaymentModalBooking(null);
        getMyBookings();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const payForBooking = async (booking) => {
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        return toast.error("Unable to load payment gateway.");
      }

      const { data } = await axios.post(
        `/api/booking/pay/${booking._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );

      if (!data.success) {
        return toast.error(data.message);
      }

      const razorpay = new window.Razorpay({
        key: data.razorpayKey,
        amount: data.amount * 100,
        currency: data.currency || "INR",
        name: "QuickShow",
        description: booking.show.movie.title,
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyResponse = await axios.post(
              "/api/booking/verify-payment",
              {
                bookingId: data.bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${await getToken()}`,
                },
              },
            );

            if (verifyResponse.data.success) {
              toast.success("Payment successful.");
              getMyBookings();
            } else {
              toast.error(verifyResponse.data.message);
            }
          } catch (error) {
            toast.error(error.message);
          }
        },
        theme: {
          color: "#F84565",
        },
      });

      razorpay.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
      });
      razorpay.open();
      setPaymentModalBooking(null); // Close modal on opening Razorpay
    } catch (error) {
      toast.error(error.message);
    }
  };

  const canRequestCancellation = (booking) => {
    if (!booking?.isPaid || booking?.isCancelled) return false;
    if (booking?.cancellationStatus && booking.cancellationStatus !== "none") return false;

    const showTime = new Date(booking?.show?.showDateTime || 0).getTime();
    const fiveHoursInMs = 5 * 60 * 60 * 1000;
    return showTime - Date.now() >= fiveHoursInMs;
  };

  const requestCancellation = async (bookingId) => {
    try {
      const { data } = await axios.post(
        `/api/user/cancellation-request/${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );

      if (data.success) {
        toast.success(data.message);
        getMyBookings();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const printTicket = (booking) => {
    const ticketNo = String(booking._id || "").slice(-8).toUpperCase();
    const seats = Array.isArray(booking.bookedSeats)
      ? booking.bookedSeats.join(", ")
      : "N/A";

    const ticketWindow = window.open("", "_blank", "width=800,height=700");
    if (!ticketWindow) {
      toast.error("Unable to open ticket window.");
      return;
    }

    ticketWindow.document.write(`
      <html>
        <head>
          <title>QuickShow Ticket ${ticketNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #0b0b0f; color: #fff; }
            .ticket { border: 2px dashed #f84565; border-radius: 16px; max-width: 560px; margin: 0 auto; padding: 20px; background: #14141b; }
            .title { color: #f84565; font-size: 22px; font-weight: 700; margin-bottom: 10px; }
            .row { margin: 8px 0; }
            .label { color: #bfbfc6; }
            .ticket-no { font-weight: 700; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="title">QuickShow Movie Ticket</div>
            <div class="row"><span class="label">Ticket No:</span> <span class="ticket-no">${ticketNo}</span></div>
            <div class="row"><span class="label">Theater:</span> ${booking.show?.theater?.name || "N/A"}</div>
            <div class="row"><span class="label">Movie:</span> ${booking.show?.movie?.title || "N/A"}</div>
            <div class="row"><span class="label">Show Time:</span> ${booking.show?.showDateTime ? dateFormat(booking.show.showDateTime) : "N/A"}</div>
            <div class="row"><span class="label">Seats:</span> ${seats}</div>
            <div class="row"><span class="label">Amount Paid:</span> ${currency} ${booking.amount}</div>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    ticketWindow.document.close();
  };

  useEffect(() => {
    if (user) {
      getMyBookings();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <div>
        <BlurCircle bottom="0px" left="600px" />
      </div>
      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      {bookings.map((item, index) => (
        <div
          key={index}
          className=" flex flex-col md:flex-row justify-between bg-primary/8 border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
        >
          <div className="flex flex-col md:flex-row">
            <img
              src={image_base_url + item.show.movie.poster_path}
              alt=""
              className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded"
            />

            <div className="flex flex-col p-4">
              <p className="text-lg font-semibold">{item.show.movie.title}</p>
              <p className="text-gray-400 text-sm">
                {timeFormat(item.show.movie.runtime)}
              </p>
              <p className="text-gray-400 text-sm mt-auto">
                {dateFormat(item.show.showDateTime)}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:items-end md:text-right justify-between p-4">
            <div className="flex items-center gap-4">
              <p className="text-2xl font-semibold mb-3">
                {" "}
                {currency} {item.amount}
              </p>
              {!item.isPaid && (
                <button
                  onClick={() => openPaymentModal(item)}
                  className="bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer"
                >
                  Pay Now
                </button>
              )}
              {item.isPaid && !item.isCancelled && (
                <button
                  onClick={() =>
                    setSelectedTicketId((prev) => (prev === item._id ? null : item._id))
                  }
                  className="bg-green-600 hover:bg-green-700 px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer"
                >
                  {selectedTicketId === item._id ? "Hide Ticket" : "View Ticket"}
                </button>
              )}
              {canRequestCancellation(item) && (
                <button
                  onClick={() => requestCancellation(item._id)}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer"
                >
                  Cancel Ticket
                </button>
              )}
            </div>

            <div className="text-sm">
              <p>
                <span className="text-gray-400"> Total Tickets:</span>
                {item.bookedSeats.length}
              </p>
              <p>
                <span className="text-gray-400"> Seat Number:</span>
                {item.bookedSeats.join(", ")}
              </p>
              {item.cancellationStatus === "requested" && (
                <p className="text-yellow-400 mt-1">Cancellation Requested (Pending Admin)</p>
              )}
              {item.isCancelled && (
                <p className="text-red-400 mt-1">Booking Cancelled</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl border border-primary/30 bg-[#111] p-5">
            <h2 className="text-lg font-semibold">Booking Ticket</h2>
            <p className="text-sm text-gray-300 mt-1">
              Ticket No: {String(selectedBooking._id).slice(-8).toUpperCase()}
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-gray-400">Theater:</span>{" "}
                {selectedBooking.show?.theater?.name || "N/A"}
              </p>
              <p>
                <span className="text-gray-400">Movie:</span>{" "}
                {selectedBooking.show?.movie?.title || "N/A"}
              </p>
              <p>
                <span className="text-gray-400">Show Time:</span>{" "}
                {selectedBooking.show?.showDateTime
                  ? dateFormat(selectedBooking.show.showDateTime)
                  : "N/A"}
              </p>
              <p>
                <span className="text-gray-400">Seats:</span>{" "}
                {Array.isArray(selectedBooking.bookedSeats)
                  ? selectedBooking.bookedSeats.join(", ")
                  : "N/A"}
              </p>
              <p>
                <span className="text-gray-400">Amount Paid:</span> {currency}{" "}
                {selectedBooking.amount}
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTicketId(null)}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => printTicket(selectedBooking)}
                className="px-4 py-2 rounded bg-primary hover:bg-primary-dull text-sm cursor-pointer"
              >
                Generate / Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-primary/30 bg-[#111] p-6 relative overflow-hidden">
            <BlurCircle top="-50px" right="-50px" />
            <h2 className="text-xl font-bold mb-4">Select Payment Method</h2>
            
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">Total Amount Payable</p>
              <p className="text-3xl font-bold mt-1">
                {currency} {paymentModalBooking.amount}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleWalletPayment(paymentModalBooking._id)}
                disabled={isWalletLoading || walletBalance < paymentModalBooking.amount}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-between font-medium transition ${
                  isWalletLoading || walletBalance < paymentModalBooking.amount
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                    : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                }`}
              >
                <span>Pay via Wallet</span>
                <span>
                  {isWalletLoading ? "Loading..." : `Balance: ${currency} ${walletBalance}`}
                </span>
              </button>
              
              {walletBalance < paymentModalBooking.amount && !isWalletLoading && (
                <p className="text-xs text-red-400 mt-1 mb-2">Insufficient wallet balance.</p>
              )}

              <button
                onClick={() => payForBooking(paymentModalBooking)}
                className="w-full py-3 px-4 rounded-lg bg-[#F84565] hover:bg-[#d83550] text-white font-medium flex justify-between items-center cursor-pointer transition"
              >
                <span>Pay via Razorpay</span>
                <span className="text-sm opacity-80">Cards / UPI / Netbanking</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 text-right">
              <button
                onClick={() => setPaymentModalBooking(null)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default MyBooking;

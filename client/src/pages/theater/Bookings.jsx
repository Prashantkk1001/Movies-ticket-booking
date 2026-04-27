import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import Loading from "../../components/Loading";
import toast from "react-hot-toast";
import { dateFormat } from "../../lib/dateFormat";
import BlurCircle from "../../components/BlurCircle";

const Bookings = () => {
  const { axios, getToken, user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get("/api/theater/bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setBookings(data.bookings);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  if (loading) return <Loading />;

  return (
    <div className="relative min-h-[80vh]">
      <BlurCircle top="-40px" left="-80px" />
      <BlurCircle bottom="-250px" right="-60px" />

      <h1 className="text-3xl font-semibold">Theater Bookings</h1>
      <p className="text-gray-400 mt-2 text-sm">
        Booking list for your theater with payment status.
      </p>
      <div className="mt-6 overflow-x-auto border border-primary/20 rounded-2xl bg-primary/5">
        <table className="w-full border-collapse overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 pl-4 font-medium">User Name</th>
              <th className="p-2 font-medium">Movie</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Seats</th>
              <th className="p-2 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {bookings.map((booking) => (
              <tr
                key={booking._id}
                className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
              >
                <td className="p-2 pl-4">{booking.userName || "User"}</td>
                <td className="p-2">{booking.show?.movie?.title || "N/A"}</td>
                <td className="p-2">
                  {booking.show?.showDateTime
                    ? dateFormat(booking.show.showDateTime)
                    : "N/A"}
                </td>
                <td className="p-2">{booking.bookedSeats?.join(", ") || "-"}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      booking.isPaid
                        ? "bg-green-600/20 text-green-400"
                        : "bg-yellow-600/20 text-yellow-300"
                    }`}
                  >
                    {booking.isPaid ? "Paid" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-gray-400">
                  No bookings found for your theater.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;

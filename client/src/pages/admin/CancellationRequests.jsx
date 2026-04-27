import React, { useEffect, useState } from "react";
import Title from "../../components/Title";
import Loading from "../../components/Loading";
import { useAppContext } from "../../context/AppContext";
import { dateFormat } from "../../lib/dateFormat";
import { toast } from "react-hot-toast";

const CancellationRequests = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get("/api/admin/cancellation-requests", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        setRequests(data.requests || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId) => {
    try {
      const { data } = await axios.post(
        `/api/admin/cancellation-requests/${requestId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );

      if (data.success) {
        toast.success(data.message);
        fetchRequests();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <Loading />;

  return (
    <>
      <Title text1="Cancellation" text2="Requests" />
      <div className="max-w-6xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Ticket No</th>
              <th className="p-2 font-medium">Movie</th>
              <th className="p-2 font-medium">Theater</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Seats</th>
              <th className="p-2 font-medium">Refund Amount</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {requests.map((request) => {
              const booking = request.booking;
              return (
                <tr
                  key={request._id}
                  className="border-b border-primary/20 bg-primary/5 even:bg-primary/10"
                >
                  <td className="p-2 pl-5">
                    {String(booking?._id || "").slice(-8).toUpperCase() || "N/A"}
                  </td>
                  <td className="p-2">{booking?.show?.movie?.title || "N/A"}</td>
                  <td className="p-2">{booking?.show?.theater?.name || "N/A"}</td>
                  <td className="p-2">
                    {booking?.show?.showDateTime
                      ? dateFormat(booking.show.showDateTime)
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {Array.isArray(booking?.bookedSeats)
                      ? booking.bookedSeats.join(", ")
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {currency} {request.amount}
                  </td>
                  <td className="p-2 capitalize">{request.status}</td>
                  <td className="p-2">
                    {request.status === "pending" ? (
                      <button
                        onClick={() => approveRequest(request._id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                      >
                        Approve
                      </button>
                    ) : (
                      "--"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CancellationRequests;

import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import Loading from "../../components/Loading";
import toast from "react-hot-toast";
import { dateFormat } from "../../lib/dateFormat";
import BlurCircle from "../../components/BlurCircle";

const Shows = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [loading, setLoading] = useState(true);
  const [shows, setShows] = useState([]);
  const [movieId, setMovieId] = useState("");
  const [showTime, setShowTime] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchShows = async () => {
    try {
      const { data } = await axios.get("/api/theater/shows", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch shows.");
    } finally {
      setLoading(false);
    }
  };

  const addShow = async () => {
    if (!movieId || !showTime || !price) {
      return toast.error("Please fill all fields.");
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/theater/add-show",
        { movieId, showTime, price: Number(price) },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        },
      );

      if (data.success) {
        toast.success(data.message);
        setMovieId("");
        setShowTime("");
        setPrice("");
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to add show.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteShow = async (showId) => {
    const confirmed = window.confirm("Delete this show?");
    if (!confirmed) return;

    try {
      const { data } = await axios.delete(`/api/theater/delete-show/${showId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success(data.message);
        setShows((prev) => prev.filter((show) => show._id !== showId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to delete show.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchShows();
    }
  }, [user]);

  if (loading) return <Loading />;

  return (
    <div className="relative min-h-[80vh]">
      <BlurCircle top="-40px" left="-80px" />
      <BlurCircle bottom="-250px" right="-60px" />

      <h1 className="text-3xl font-semibold">Manage Shows</h1>
      <p className="text-gray-400 mt-2 text-sm">
        Add new show timings and manage shows for your theater only.
      </p>

      <div className="mt-6 p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent flex flex-wrap gap-3">
        <input
          value={movieId}
          onChange={(e) => setMovieId(e.target.value)}
          placeholder="Movie ID (TMDB id)"
          className="px-3 py-2 rounded-lg bg-black/40 border border-gray-600 outline-none"
        />
        <input
          type="datetime-local"
          value={showTime}
          onChange={(e) => setShowTime(e.target.value)}
          className="px-3 py-2 rounded-lg bg-black/40 border border-gray-600 outline-none"
        />
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          className="px-3 py-2 rounded-lg bg-black/40 border border-gray-600 outline-none w-32"
        />
        <button
          onClick={addShow}
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dull transition"
        >
          Add Show
        </button>
      </div>

      <div className="mt-8 overflow-x-auto border border-primary/20 rounded-2xl bg-primary/5">
        <table className="w-full border-collapse overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 pl-4 font-medium">Movie</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Price</th>
              <th className="p-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {shows.map((show) => (
              <tr key={show._id} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
                <td className="p-2 pl-4">{show.movie?.title || show.movie}</td>
                <td className="p-2">{dateFormat(show.showDateTime)}</td>
                <td className="p-2">
                  {currency}
                  {show.showPrice}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => deleteShow(show._id)}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {shows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-gray-400">
                  No shows found for your theater.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Shows;

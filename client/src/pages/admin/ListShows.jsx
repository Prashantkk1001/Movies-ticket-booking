import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/Title";
import { dateFormat } from "../../lib/dateFormat";
import BlurCircle from "../../components/BlurCircle";
import { useAppContext } from "../../context/AppContext";

const ListShows = () => {
  const currency = import.meta.env.VITE_CURRENCY;

  const { axios, getToken, user } = useAppContext();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAllShows = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-shows", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      setShows(data.shows);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleDeleteShow = async (showId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel/delete this show?"
    );
    if (!confirmed) return;

    try {
      const { data } = await axios.delete(`/api/admin/shows/${showId}`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        setShows((prevShows) => prevShows.filter((show) => show._id !== showId));
      } else {
        alert(data.message || "Failed to delete show.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete show.");
    }
  };

  useEffect(() => {
    if (user) {
      getAllShows();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />

      <div className="max-w-4xl mt-6 overflow-x-auto">
        <BlurCircle bottom="100px" right="0px" />

        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Movie Name</th>
              <th className="p-2 font-medium ">Theater</th>
              <th className="p-2 font-medium ">Show Time</th>
              <th className="p-2 font-medium ">Total Bookings</th>
              <th className="p-2 font-medium ">Earnings</th>
              <th className="p-2 font-medium ">Action</th>
            </tr>
          </thead>

          <tbody className="text-sm font-light">
            {shows?.map((show, index) => (
              <tr
                key={index}
                className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
              >
                <td className="p-2 min-w-45 pl-5">{show.movie.title}</td>
                <td className="p-2">{show.theater?.name || "N/A"}</td>
                <td className="p-2">{dateFormat(show.showDateTime)}</td>
                <td className="p-2">
                  {Object.keys(show.occupiedSeats).length}
                </td>

                <td className="p-2">
                  {currency}{" "}
                  {Object.keys(show.occupiedSeats).length * show.showPrice}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleDeleteShow(show._id)}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default ListShows;

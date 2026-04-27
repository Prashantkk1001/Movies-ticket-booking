import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";

const TheaterShows = () => {
  const { theaterName } = useParams();
  const { axios } = useAppContext();
  const [theaterShows, setTheaterShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheaterShows = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/show/all?theaterName=${encodeURIComponent(theaterName)}`);
        if (data.success) {
          setTheaterShows(data.shows);
        }
      } catch (error) {
        console.error("Error fetching theater shows:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTheaterShows();
  }, [theaterName, axios]);

  if (loading) return <Loading />;

  return theaterShows.length > 0 ? (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      <h1 className="text-2xl font-medium my-4">
        Now Showing at <span className="text-primary font-bold">{decodeURIComponent(theaterName)}</span>
      </h1>
      <div className="flex flex-wrap max-sm:justify-center gap-8 mt-8">
        {theaterShows.map((movie) => (
          <MovieCard movie={movie} key={movie._id} />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-center">
        No Shows Available at {decodeURIComponent(theaterName)}
      </h1>
    </div>
  );
};

export default TheaterShows;

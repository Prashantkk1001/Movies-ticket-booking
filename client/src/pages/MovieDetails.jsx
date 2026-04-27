import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { Heart, PlayCircleIcon, StarIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [show, setShow] = useState(null);

  // ✅ Trailer states (INSIDE component)
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState("");

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    image_base_url,
  } = useAppContext();

  // ✅ Fetch show
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      if (data.success) {
        setShow(data); // ✅ FIXED
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ Fetch trailer
  const fetchTrailer = async () => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${show.movie._id}/videos`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
          },
        }
      );

      const data = await res.json();

      const trailer = data.results?.find(
        (vid) => vid.type === "Trailer" && vid.site === "YouTube"
      );

      if (trailer) {
        setTrailerKey(trailer.key);
        setShowTrailer(true);
      } else {
        toast.error("Trailer not available");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ Favorite
  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please Login to Proceed");

      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getShow();
  }, [id]);

  const uniqueTheaters = show?.dateTime
    ? Object.values(show.dateTime)
        .flat()
        .reduce((acc, current) => {
          if (
            current.theater &&
            !acc.find((t) => t._id === current.theater._id)
          ) {
            acc.push(current.theater);
          }
          return acc;
        }, [])
    : [];

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={image_base_url + show.movie.poster_path}
          alt=""
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100" />

          <p className="text-primary">ENGLISH</p>

          <h1 className="text-4xl font-semibold max-w-96">
            {show.movie.title}
          </h1>

          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie.vote_average?.toFixed(1)} User Rating
          </div>

          <p className="text-gray-400 mt-2 text-sm max-w-xl">
            {show.movie.overview}
          </p>

          <p>
            {timeFormat(show?.movie?.runtime)} •{" "}
            {show.movie.genres.map((g) => g.name).join(",")} •{" "}
            {show.movie.release_date.split("-")[0]}
          </p>

          {/* 🎬 Buttons */}
          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button
              onClick={fetchTrailer}
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 rounded-md"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>

            {Object.keys(show.dateTime).length > 0 && (
              <a
                href="#dateSelect"
                className="px-10 py-3 text-sm bg-primary rounded-md"
              >
                Buy Tickets
              </a>
            )}

            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full"
            >
              <Heart
                className={`w-5 h-5 ${
                  favoriteMovies.find((m) => m._id === id)
                    ? "fill-primary text-primary"
                    : ""
                }`}
              />
            </button>
          </div>

          {/* 🏛️ Available Theaters */}
          {uniqueTheaters.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-400 mb-2">Available at:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueTheaters.map((theater) => (
                  <span
                    key={theater._id}
                    className="px-3 py-1 bg-gray-800/80 text-gray-200 text-xs rounded-full border border-gray-700"
                  >
                    {theater.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🎭 Cast */}
      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
      <div className="flex gap-4 mt-6 overflow-x-auto">
        {show.movie.casts.slice(0, 12).map((cast, i) => (
          <div key={i} className="text-center">
            <img
              src={image_base_url + cast.profile_path}
              className="h-20 w-20 rounded-full object-cover"
            />
            <p className="text-xs mt-2">{cast.name}</p>
          </div>
        ))}
      </div>

      {Object.keys(show.dateTime).length > 0 ? (
        <DateSelect dateTime={show.dateTime} id={id} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border border-primary/20 bg-primary/5 rounded-lg mt-10">
          <h2 className="text-xl font-medium text-gray-300">No shows currently scheduled</h2>
          <p className="text-gray-500 mt-2">Please check back later for available timings.</p>
        </div>
      )}

      {/* 🎬 Recommended */}
      <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>
      <div className="flex flex-wrap gap-6">
        {shows.slice(0, 4).map((m, i) => (
          <MovieCard key={i} movie={m} />
        ))}
      </div>

      {/* 🔘 Show more */}
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary rounded-md"
        >
          Show more
        </button>
      </div>

      {/* 🎬 Trailer Modal (LAST) */}
      {showTrailer && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className="bg-black p-4 rounded-lg relative w-[90%] max-w-3xl">
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-2 right-2 text-white text-xl"
            >
              ✖
            </button>

            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${trailerKey}`}
              allowFullScreen
              className="rounded-md"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
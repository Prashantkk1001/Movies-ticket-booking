import axios from "axios";
import "dotenv/config";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import Theater from "../models/Theater.js";
import { inngest } from "../inngest/index.js";
import https from "https";

const tmdbAxios = axios.create({
  httpsAgent: new https.Agent({ keepAlive: true, family: 4 }), // force IPv4 and keepAlive to prevent ECONNRESET
});

// API to get now playing movies from TMDB API

export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await tmdbAxios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      },
    );

    const movies = data.results;
    res.json({ success: true, movies: movies });
  } catch (error) {
    console.error("Error fetching now playing movies:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to add a new show to the database

export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice, theaterId } = req.body;

    let movie = await Movie.findById(movieId);

    if (!movie) {
      // Fetch movie details and credits from TMDB API
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        tmdbAxios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }),

        tmdbAxios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }),
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      // Add movie to the database
      movie = await Movie.create(movieDetails);
    }

    const showsToCreate = [];
    showsInput.forEach((show) => {
      const showDate = show.date;
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        showsToCreate.push({
          movie: movieId,
          theater: theaterId,
          theaterId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {},
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    //Trigger inggest event

    await inngest.send({
      name: "app/show.added",
      data: { movieTitle: movie.title },
    });

    res.json({ success: true, message: "Shows added successfully." });
  } catch (error) {
    console.error("Error adding new show:", error);
    res.json({ success: false, message: error.message });
  }
};

// API TO GET ALL SHOWS FROM DATABASE

export const getShows = async (req, res) => {
  try {
    const { theaterName, theaterId } = req.query;
    const query = {};

    if (theaterId) {
      query.theater = theaterId;
    } else if (theaterName) {
      const decodedTheaterName = decodeURIComponent(theaterName);
      const theater = await Theater.findOne({ name: decodedTheaterName });

      if (!theater) {
        return res.json({ success: true, shows: [] });
      }

      query.theater = theater._id;
    }

    const shows = await Show.find(query)
      // { showDateTime: { $gte: new Date() } }
      .populate("movie")
      .sort({ showDateTime: 1 });

    // Filter unique movies by movie id
    const uniqueMoviesMap = new Map();
    shows.forEach((show) => {
      if (show.movie?._id && !uniqueMoviesMap.has(show.movie._id.toString())) {
        uniqueMoviesMap.set(show.movie._id.toString(), show.movie);
      }
    });

    res.json({ success: true, shows: Array.from(uniqueMoviesMap.values()) });
  } catch (error) {
    console.error("Error fetching shows:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get single shows from the database

export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    // get all upcoming shows for a movie
    const shows = await Show.find({
      movie: movieId,
      // showDateTime: { $gte: new Date() },
    }).populate("theater");

    const movie = await Movie.findById(movieId);
    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }

      dateTime[date].push({
        time: show.showDateTime,
        showId: show._id,
        theater: show.theater,
      });
    });
    res.json({ success: true, movie, dateTime });
  } catch (error) {
    console.error("Error fetching show:", error);
    res.json({ success: false, message: error.message });
  }
};

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [isTheater, setIsTheater] = useState(false);
  const [isTheaterLoading, setIsTheaterLoading] = useState(false);
  const [theaterInfo, setTheaterInfo] = useState(null);
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);

  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchIsAdmin = async () => {
    try {
      const { data } = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      setIsAdmin(data.isAdmin);

      if (!data.isAdmin && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("You are not authorized to access admin dashboard");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchShows = async () => {
    try {
      const { data } = await axios.get("/api/show/all");

      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFavoriteMovies = async () => {
    try {
      const { data } = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setFavoriteMovies(data.movies);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUserRole = async () => {
    try {
      const { data } = await axios.get("/api/user/role", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setUserRole(data.role || "user");
        return data.role || "user";
      }
    } catch (error) {
      setUserRole("user");
    }

    return "user";
  };

  const fetchTheaterProfile = async () => {
    setIsTheaterLoading(true);
    try {
      const { data } = await axios.get("/api/theater/me", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setIsTheater(true);
        setTheaterInfo(data.theater);
      } else {
        setIsTheater(false);
        setTheaterInfo(null);
      }
    } catch (error) {
      setIsTheater(false);
      setTheaterInfo(null);
    } finally {
      setIsTheaterLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (user) {
      const initializeUserContext = async () => {
        const role = await fetchUserRole();
        fetchFavoriteMovies();
        if (role === "admin") {
          fetchIsAdmin();
        } else {
          setIsAdmin(false);
        }

        if (role === "theater") {
          fetchTheaterProfile();
        } else {
          setIsTheater(false);
          setTheaterInfo(null);
          setIsTheaterLoading(false);
        }
      };

      initializeUserContext();
    } else {
      setUserRole("user");
      setIsAdmin(false);
      setIsTheater(false);
      setTheaterInfo(null);
      setIsTheaterLoading(false);
    }
  }, [user]);

  const value = {
    axios,
    fetchIsAdmin,
    user,
    getToken,
    navigate,
    isAdmin,
    userRole,
    isTheater,
    isTheaterLoading,
    theaterInfo,
    shows,
    favoriteMovies,
    fetchFavoriteMovies,
    fetchTheaterProfile,
    image_base_url,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
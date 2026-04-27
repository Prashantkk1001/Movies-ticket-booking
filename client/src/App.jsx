import React from "react";
import Navbar from "./components/Navbar";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import SeatLayout from "./pages/SeatLayout";
import MyBooking from "./pages/MyBooking";
import Favorite from "./pages/Favorite";
import Wallet from "./pages/Wallet";
import Theaters from "./pages/Theaters";
import TheaterShowsPage from "./pages/TheaterShows";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";
import Layout from "./pages/admin/Layout";
import Dashboard from "./pages/admin/Dashboard";
import ListShows from "./pages/admin/ListShows";
import AddShows from "./pages/admin/AddShows";
import ListBookings from "./pages/admin/ListBookings";
import CancellationRequests from "./pages/admin/CancellationRequests";
import ListTheaters from "./pages/admin/ListTheaters";
import { useAppContext } from "./context/AppContext";
import { SignIn } from "@clerk/clerk-react";
import Loading from "./components/Loading";
import TheaterLayout from "./pages/theater/TheaterLayout";
import TheaterDashboard from "./pages/theater/Dashboard";
import TheaterOwnerShows from "./pages/theater/Shows";
import TheaterBookings from "./pages/theater/Bookings";
import { useEffect } from "react";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isTheaterRoute = location.pathname.startsWith("/theater");

  const { user, isTheater, isTheaterLoading } = useAppContext();

  useEffect(() => {
    if (!isTheaterLoading && user && isTheater && !isTheaterRoute) {
      navigate("/theater/dashboard");
    }
  }, [user, isTheater, isTheaterLoading, isTheaterRoute, navigate]);

  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movies/:id/:date" element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBooking />} />
        <Route path="/loading/:nextUrl" element={<Loading />} />

        <Route path="/favorite" element={<Favorite />} />
        <Route path="/wallet" element={<Wallet />} />

        <Route path="/theaters" element={<Theaters />} />
        <Route path="/theaters/:theaterName" element={<TheaterShowsPage />} />

        <Route
          path="/admin/*"
          element={
            user ? (
              <Layout />
            ) : (
              <div className="min-h-screen flex justify-center items-center">
                <SignIn fallbackRedirectUrl={"/admin"} />
              </div>
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="list-shows" element={<ListShows />} />
          <Route path="add-shows" element={<AddShows />} />
          <Route path="list-bookings" element={<ListBookings />} />
          <Route path="theaters" element={<ListTheaters />} />
          <Route
            path="cancellation-requests"
            element={<CancellationRequests />}
          />
        </Route>

        <Route path="/theater/*" element={<TheaterLayout />}>
          <Route index element={<TheaterDashboard />} />
          <Route path="dashboard" element={<TheaterDashboard />} />
          <Route path="shows" element={<TheaterOwnerShows />} />
          <Route path="bookings" element={<TheaterBookings />} />
        </Route>
      </Routes>
      {!isAdminRoute && !isTheaterRoute && <Footer />}
    </>
  );
};

export default App;

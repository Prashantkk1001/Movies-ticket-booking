import React, { useEffect, useState } from "react";
import { CalendarDays, CircleDollarSign, Ticket } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import Loading from "../../components/Loading";
import BlurCircle from "../../components/BlurCircle";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { axios, getToken, user, theaterInfo } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalShows: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  const fetchDashboard = async () => {
    try {
      const response = await axios.get("/api/theater/dashboard", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (response.data.success) {
        setData(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  const cards = [
    { title: "Total Shows", value: data.totalShows, icon: CalendarDays },
    { title: "Total Bookings", value: data.totalBookings, icon: Ticket },
    {
      title: "Total Revenue",
      value: `${currency}${data.totalRevenue}`,
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="relative min-h-[80vh]">
      <BlurCircle top="-40px" left="-80px" />
      <BlurCircle bottom="-220px" right="-40px" />

      <h1 className="text-3xl font-semibold">
        {theaterInfo?.name || "My Theater"} Dashboard
      </h1>
      <p className="text-sm text-gray-400 mt-2">
        {theaterInfo?.location || "Manage your shows and bookings"}
      </p>
      <div className="flex flex-wrap gap-6 mt-8">
        {cards.map((card) => (
          <div
            key={card.title}
            className="flex items-center justify-between px-5 py-5 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/25 rounded-2xl w-full max-w-xs"
          >
            <div>
              <p className="text-sm text-gray-300">{card.title}</p>
              <p className="text-2xl font-semibold mt-1">{card.value}</p>
            </div>
            <div className="bg-primary/20 rounded-full p-2.5">
              <card.icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";

const Theaters = () => {
  const navigate = useNavigate();
  const { axios } = useAppContext();
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheaters = async () => {
      try {
        const { data } = await axios.get("/api/theater/all");
        if (data.success) {
          setTheaters(data.theaters);
        }
      } catch (error) {
        console.error("Error fetching theaters:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTheaters();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="relative my-40 px-6 md:px-16 lg:px-40 xl:px-44 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <h1 className="text-3xl font-bold mb-8">Select a Theater</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {theaters.length > 0 ? (
          theaters.map((theater) => (
            <div
              key={theater._id}
              onClick={() => {
                navigate(`/theaters/${encodeURIComponent(theater.name)}`);
                window.scrollTo(0, 0);
              }}
              className="bg-primary/10 border border-primary/20 p-8 rounded-xl cursor-pointer hover:bg-primary/20 hover:scale-105 transition-all text-center flex flex-col justify-center items-center min-h-[150px]"
            >
              <h2 className="text-xl font-semibold text-white">{theater.name}</h2>
              <p className="text-sm text-gray-400 mt-2">View Available Shows</p>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-400 mt-10">No theaters currently available.</p>
        )}
      </div>
    </div>
  );
};

export default Theaters;

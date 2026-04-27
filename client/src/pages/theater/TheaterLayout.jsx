import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import TheaterSidebar from "../../components/theater/TheaterSidebar";
import { useAppContext } from "../../context/AppContext";
import Loading from "../../components/Loading";

const TheaterLayout = () => {
  const navigate = useNavigate();
  const { isTheater, isTheaterLoading, fetchTheaterProfile } = useAppContext();

  useEffect(() => {
    fetchTheaterProfile();
  }, []);

  if (isTheaterLoading) {
    return <Loading />;
  }

  if (!isTheater) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div className="border border-primary/20 bg-primary/5 rounded-2xl p-8 max-w-md">
          <h2 className="text-2xl font-semibold">Theater Access Only</h2>
          <p className="text-gray-400 mt-2">
            This panel is available only for theater owner accounts.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 px-5 py-2 rounded-lg bg-primary hover:bg-primary-dull transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24">
      <div className="flex min-h-[calc(100vh-96px)]">
        <TheaterSidebar />
        <div className="relative flex-1 px-4 py-10 md:px-10 h-[calc(100vh-96px)] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TheaterLayout;

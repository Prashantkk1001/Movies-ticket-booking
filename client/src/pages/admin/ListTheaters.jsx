import React, { useEffect, useState } from "react";
import Title from "../../components/Title";
import Loading from "../../components/Loading";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const ListTheaters = () => {
  const { axios, getToken, user } = useAppContext();
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTheaterName, setNewTheaterName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchTheaters = async () => {
    try {
      const { data } = await axios.get("/api/theater/all");
      if (data.success) {
        setTheaters(data.theaters || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTheater = async (e) => {
    e.preventDefault();
    if (!newTheaterName.trim()) return toast.error("Theater name is required");

    setIsAdding(true);
    try {
      const { data } = await axios.post(
        "/api/theater/add",
        { name: newTheaterName.trim() },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setNewTheaterName("");
        fetchTheaters();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteTheater = async (id) => {
    try {
      const { data } = await axios.post(
        `/api/theater/delete/${id}`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success(data.message);
        fetchTheaters();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTheaters();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <Loading />;

  return (
    <>
      <Title text1="Theaters" text2="List" />
      
      <div className="max-w-4xl mt-6 bg-primary/5 border border-primary/20 rounded-md p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Add New Theater</h2>
        <form onSubmit={addTheater} className="flex gap-4">
          <input
            type="text"
            value={newTheaterName}
            onChange={(e) => setNewTheaterName(e.target.value)}
            placeholder="e.g. PVR Cinemas"
            className="flex-1 bg-transparent border border-gray-600 rounded px-4 py-2 outline-none focus:border-primary text-white"
          />
          <button 
            type="submit" 
            disabled={isAdding}
            className={`bg-primary px-6 py-2 rounded text-white font-medium ${isAdding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dull cursor-pointer'}`}
          >
            {isAdding ? "Adding..." : "Add Theater"}
          </button>
        </form>
      </div>

      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap border border-primary/20">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-4 font-medium pl-6">#</th>
              <th className="p-4 font-medium">Theater Name</th>
              <th className="p-4 font-medium text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {theaters.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-6 text-center text-gray-400 border-b border-primary/20">
                  No theaters found. Add one above!
                </td>
              </tr>
            ) : (
              theaters.map((theater, index) => (
                <tr
                  key={theater._id}
                  className="border-b border-primary/20 bg-primary/5 even:bg-primary/10"
                >
                  <td className="p-4 pl-6 text-gray-300">{index + 1}</td>
                  <td className="p-4 font-medium">{theater.name}</td>
                  <td className="p-4 text-right pr-6">
                    <button
                      onClick={() => deleteTheater(theater._id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-400/10 px-3 py-1 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ListTheaters;

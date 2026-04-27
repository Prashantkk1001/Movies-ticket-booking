import React, { useEffect, useState } from "react";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";

const Wallet = () => {
  const { axios, getToken, user } = useAppContext();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const currency = import.meta.env.VITE_CURRENCY || "$";

  const fetchWalletBalance = async () => {
    try {
      const { data } = await axios.get("/api/user/wallet", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.log("Error fetching wallet balance:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[50vh]">
      <BlurCircle top="50px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      <h1 className="text-2xl font-semibold mb-8">My Wallet</h1>

      <div className="bg-primary/10 border border-primary/20 p-8 rounded-2xl max-w-xl shadow-lg relative overflow-hidden">
        <BlurCircle top="-50px" right="-50px" />
        
        <p className="text-gray-300 text-sm mb-2 font-medium">Available Balance</p>
        <h2 className="text-5xl font-bold text-white mb-6">
          {currency} {balance}
        </h2>

        <div className="bg-black/40 rounded-lg p-4 border border-white/5">
          <p className="text-sm text-gray-400 leading-relaxed">
            When you cancel a booking, your refund is automatically credited to this wallet. You can use your wallet balance for future ticket purchases.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Wallet;

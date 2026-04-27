import React from "react";
import { NavLink } from "react-router-dom";
import { CalendarDays, LayoutDashboard, Ticket } from "lucide-react";

const links = [
  { name: "Dashboard", path: "/theater/dashboard", icon: LayoutDashboard },
  { name: "Shows", path: "/theater/shows", icon: CalendarDays },
  { name: "Bookings", path: "/theater/bookings", icon: Ticket },
];

const TheaterSidebar = () => {
  return (
    <div className="h-[calc(100vh-96px)] sticky top-24 flex flex-col pt-8 max-w-14 md:max-w-64 w-full border-r border-gray-300/20 text-sm bg-black/40">
      <p className="hidden md:block px-6 text-lg font-semibold text-primary">
        Theater Panel
      </p>
      <div className="w-full mt-4">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `relative flex items-center max-md:justify-center gap-2 w-full py-3 md:pl-6 text-gray-300 transition ${
                isActive
                  ? "bg-gradient-to-r from-primary/25 to-transparent text-primary"
                  : "hover:bg-primary/10"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className="w-5 h-5" />
                <p className="max-md:hidden">{link.name}</p>
                <span
                  className={`w-1.5 h-10 rounded-l right-0 absolute ${
                    isActive ? "bg-primary" : ""
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default TheaterSidebar;

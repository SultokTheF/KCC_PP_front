import React from "react";
import Year from "./Year";
import "./Navbar.css";
const Navbar = ({ date, setDate, data, setData }) => {
  return (
    <div className="flex w-full justify-between items-center px-4 py-2 border-b">
      <span>

      </span>

      <div className="flex items-center space-x-3">
        <Year date={date} setDate={setDate} />
      </div>

      <div className="flex">
      </div>
    </div>
  );
};

export default Navbar;

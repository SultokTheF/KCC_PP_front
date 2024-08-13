import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";

import Month from "./Selectors/Month";
const Calendar = ({ selectedMonth, setSelectedMonth, data, setData }) => {
  const [date, setDate] = useState({
    year: selectedMonth.year,
    month: selectedMonth.month
  });

  useEffect(() => {
    setSelectedMonth(date);
  }, [date]);

  return (
    <>
      <div className="bg-gray-100 rounded-lg shadow-lg">
        <div className="flex h-12 w-full bg-gray-200 justify-center items-center rounded-t-lg">
          <Navbar 
            date={date}
            setDate={setDate}
            data={data}
            setData={setData}
          />
        </div>
        <Month
          date={date}
          setDate={setDate}
        />
      </div>
    </>
  )
}

export default Calendar;
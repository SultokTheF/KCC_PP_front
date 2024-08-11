import React, { useState, useEffect } from "react";
import Day from "./Selectors/Day";
import Month from "./Selectors/Month";
import Year from "./Selectors/Year";

const Calendar = ({ selectedDate, setSelectedDate, holidays }) => {
  const [date, setDate] = useState({
    day: String(new Date().getDate()).padStart(2, '0'),
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: new Date().getFullYear(),
    selectedDate: selectedDate
  });

  useEffect(() => {
    const updatedDate = new Date(`${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`);
    setDate((prevDate) => ({
      ...prevDate,
      selectedDate: updatedDate.toISOString().split('T')[0]
    }));
    setSelectedDate(updatedDate.toISOString().split('T')[0])
  }, [date.day, date.month, date.year]);

  return (
    <div className="bg-gray-100 rounded-lg shadow-lg">
      <div className="flex h-12 w-full bg-gray-200 justify-center items-center rounded-t-lg">
        <Month date={date} setDate={setDate} />
        <Year date={date} setDate={setDate} />
      </div>
      <Day date={date} setDate={setDate} holidays={holidays} />
    </div>
  );
}

export default Calendar;

import React, { useState, useEffect } from "react";
import Sidebar from "../../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

import Calendar from "./Calendar/Calendar";
import AddHolidayForm from "./AddHolidayForm";

const Holiday = () => {
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      const holidaysResponse = await axiosInstance.get(endpoints.HOLIDAYS);
      setHolidays(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Calendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          holidays={holidays}
        />
        <AddHolidayForm 
          selectedDate={selectedDate}
          holidays={holidays}
          fetchData={fetchData}
        />
      </div>
    </div>
  );
}

export default Holiday;

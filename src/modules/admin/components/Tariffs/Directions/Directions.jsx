import { useEffect, useState } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

import Sidebar from "../../Sidebar/Sidebar";
import Calendar from "./Calendar/Calendar";

import DirectionsTable from "./DirectionsTable";

const Directions = () => {
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const [data, setData] = useState({
    subject: 0,
    subjects: [],
    tableData: [],
    provider: 0,
    providers: [],
    days: [],
    hours: [],
  });

  const fetchData = async () => {
    try {
      const [subjectsResponse, providersResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS),
        axiosInstance.get(endpoints.PROVIDERS),
      ]);

      setData((prevData) => ({
        ...prevData,
        subjects: subjectsResponse.data,
        providers: providersResponse.data,
        provider: providersResponse.data.length > 0 ? providersResponse?.data[0].id : 0,
        subject: subjectsResponse.data.length > 0 ? subjectsResponse?.data[0].id : 0,
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchDays = async () => {
    try {
      const daysResponse = await axiosInstance.get(endpoints.DAYS);
      const days = daysResponse.data.filter(day => {
        const date = new Date(day.date);
        return date.getFullYear() === selectedMonth.year && date.getMonth() === selectedMonth.month;
      });

      const filteredDays = days.filter(day => day.subject === data.subject);

      setData((prevData) => ({
        ...prevData,
        days: filteredDays,
      }));

      // Generate the table data regardless of whether filteredDays has data
      fetchHours(filteredDays);
    } catch (error) {
      console.error('Error fetching days:', error);
    }
  };

  const fetchHours = async (filteredDays) => {
    try {
      const hoursResponse = await axiosInstance.get(endpoints.HOURS);
      const hours = hoursResponse.data.filter(hour => filteredDays.some(day => day.id === hour.day));

      setData((prevData) => ({
        ...prevData,
        hours: hours,
      }));

      // Generate table data after hours have been fetched or if there are no days
      generateTableData(filteredDays, hours);
    } catch (error) {
      console.error('Error fetching hours:', error);
    }
  };

  const generateTableData = (filteredDays, hours) => {
    const tableData = [];

    // Get the total number of days in the selected month
    const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();

    // Loop through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDay = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Find the day data that matches the formatted day
      const dayData = filteredDays.find(d => d.date.split('T')[0] === formattedDay);

      // Initialize an array of "NONE" for 24 hours
      const hoursData = new Array(24).fill("NONE");

      if (dayData) {
        // Find all hours for this specific day
        const dayHours = hours.filter(hour => hour.day === dayData.id);

        // Map the found hours to the correct index in the array
        dayHours.forEach((hour) => {
          const hourIndex = parseInt(hour.hour) - 1;
          hoursData[hourIndex] = hour.direction;
        });
      }

      // Push the formatted day and its hours data to tableData
      tableData.push({
        [formattedDay]: hoursData
      });
    }

    setData((prevData) => ({
      ...prevData,
      tableData: tableData,
    }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchDays();
  }, [selectedMonth, data.subject]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="w-full">
        <Calendar
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          data={data}
          setData={setData}
        />
        <DirectionsTable
          data={data}
          setData={setData}
          selectedMonth={selectedMonth}
        />
      </div>
    </div>
  );
};

export default Directions;

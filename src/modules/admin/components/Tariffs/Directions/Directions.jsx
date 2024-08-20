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
      const daysResponse = await axiosInstance.get(endpoints.DAYS, {
        params: {
          subject: data.subject,
        },
      });

      setData((prevData) => ({
        ...prevData,
        days: daysResponse.data,
      }));

      // After fetching days, fetch hours for each day
      const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const formattedDay = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        await fetchHoursForDay(formattedDay);
      }
    } catch (error) {
      console.error('Error fetching days:', error);
    }
  };

  const fetchHoursForDay = async (day) => {
    try {
      const hoursResponse = await axiosInstance.get(endpoints.HOURS, {
        params: {
          day,
          sub: data.subject,
        },
      });

      updateTableDataForDay(day, hoursResponse.data);
    } catch (error) {
      if (error.response && error.response.data.error === "No hours found with the provided criteria.") {
        console.warn(`No hours found for day ${day}, filling table data with "NONE".`);
        updateTableDataForDay(day, []);
      } else {
        console.error(`Error fetching hours for day ${day}:`, error);
      }
    }
  };

  const updateTableDataForDay = (day, hours) => {
    setData((prevData) => {
      const tableData = [...prevData.tableData];
      const dayData = prevData.days.find(d => d.date.split('T')[0] === day);
      const hoursData = new Array(24).fill("NONE");

      if (dayData) {
        hours.forEach((hour) => {
          const hourIndex = parseInt(hour.hour) - 1;
          hoursData[hourIndex] = hour.direction;
        });
      }

      // Update or add the day data in the tableData array
      const existingDayIndex = tableData.findIndex(item => item[day]);
      if (existingDayIndex !== -1) {
        tableData[existingDayIndex][day] = hoursData;
      } else {
        tableData.push({
          [day]: hoursData
        });
      }

      return {
        ...prevData,
        tableData,
      };
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data.subject) {
      // Clear old tableData when month, year, or subject changes
      setData((prevData) => ({
        ...prevData,
        tableData: [],
      }));
      fetchDays();
    }
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

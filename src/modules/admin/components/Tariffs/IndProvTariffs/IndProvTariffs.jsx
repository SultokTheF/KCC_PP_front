import { useState, useEffect } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

import Sidebar from "../../Sidebar/Sidebar";
import Calendar from "./Calendar/Calendar";

import IndProvTariffsTable from "./IndProvTariffsTable";

const IndProvTariffs = () => {
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
    hours: []
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
          year: selectedMonth.year,
          month: selectedMonth.month + 1, // API expects 1-based month
          subject: data.subject,
        },
      });

      setData((prevData) => ({
        ...prevData,
        days: daysResponse.data,
      }));

      // Fetch hours after fetching days
      fetchHours(daysResponse.data);
    } catch (error) {
      console.error('Error fetching days:', error);
    }
  };

  const fetchHours = async (days) => {
    try {
      const startDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;
      const endDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate()}`;

      const hoursResponse = await axiosInstance.get(endpoints.HOURS, {
        params: {
          start_date: startDate,
          end_date: endDate,
          sub: data.subject,
        },
      });

      // If hours are found, update the state with the response
      setData((prevData) => ({
        ...prevData,
        hours: hoursResponse.data,
      }));

      generateTableData(days, hoursResponse.data);
    } catch (error) {
      // If no hours are found, set the table data to zeroes
      if (error.response && error.response.data.error === "No hours found with the provided criteria.") {
        console.warn('No hours found, filling table data with zeroes.');
        generateTableData(days, []);
      } else {
        console.error('Error fetching hours:', error);
      }
    }
  };

  const generateTableData = (days, hours) => {
    const tableData = [];

    // Get the total number of days in the selected month
    const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();

    // Loop through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDay = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Find the day data that matches the formatted day
      const dayData = days.find(d => d.date.split('T')[0] === formattedDay);

      // Initialize an array of "0" for 24 hours
      const hoursData = new Array(24).fill(0);

      if (dayData) {
        // Find all hours for this specific day
        const dayHours = hours.filter(hour => hour.day === dayData.id);

        // Map the found hours to the correct index in the array
        dayHours.forEach((hour) => {
          const hourIndex = parseInt(hour.hour) - 1;
          hoursData[hourIndex] = hour.Ind_Prov_T;
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

    console.log('Table data generated:', tableData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data.subject) {
      fetchDays();
    }
  }, [selectedMonth, data.subject]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Calendar
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          data={data}
          setData={setData}
        />

        <IndProvTariffsTable
          selectedMonth={selectedMonth}
          data={data}
          setData={setData}
        />
      </div>
    </div>
  );
};

export default IndProvTariffs;

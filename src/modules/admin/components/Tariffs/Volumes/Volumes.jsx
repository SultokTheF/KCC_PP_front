import { useState, useEffect } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

import Sidebar from "../../Sidebar/Sidebar";
import Calendar from "./Calendar/Calendar";

import VolumesTable from "./VolumesTable";

const Volumes = () => {
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
    subject_type: "ЭПО",
    days: [],
    hours: [],
  });

  const [loading, setLoading] = useState(false); // Add loading state

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
      console.error("Error fetching data:", error);
    }
  };

  const fetchDays = async () => {
    setLoading(true); // Start loading
    try {
      const startDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;
      const endDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate()}`;

      const daysResponse = await axiosInstance.get(endpoints.DAYS, {
        params: {
          start_date: startDate,
          end_date: endDate,
          sub: data.subject,
        },
      });

      setData((prevData) => ({
        ...prevData,
        days: daysResponse.data,
      }));

      // Fetch hours after fetching days
      await fetchHours(daysResponse.data);
    } catch (error) {
      if (error.response && error.response.data.error === "No days found with the provided criteria.") {
        console.warn("No days found, filling table data with zeroes.");
        const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
        const emptyDays = [];

        // Generate an empty list of days to fill with zeroes
        for (let day = 1; day <= daysInMonth; day++) {
          const formattedDay = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          emptyDays.push({ date: formattedDay });
        }

        // Generate table data with zeroes
        generateTableData(emptyDays, []);
      } else {
        console.error("Error fetching days:", error);
      }
    } finally {
      setLoading(false); // End loading
    }
  };

  const fetchHours = async (days) => {
    try {
      const startDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-01`;
      const endDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-${new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate()}`;

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
        console.warn("No hours found, filling table data with zeroes.");
        generateTableData(days, []);
      } else {
        console.error("Error fetching hours:", error);
      }
    }
  };

  const generateTableData = (days, hours) => {
    const tableData = [];

    // Get the total number of days in the selected month
    const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();

    // Loop through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDay = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Find the day data that matches the formatted day
      const dayData = days.find((d) => d.date.split("T")[0] === formattedDay);

      // Initialize an array of "0" for 24 hours
      const hoursData = new Array(24).fill(0);

      if (dayData) {
        // Find all hours for this specific day
        const dayHours = hours.filter((hour) => hour.day === dayData.id);

        // Map the found hours to the correct index in the array
        dayHours.forEach((hour) => {
          const hourIndex = parseInt(hour.hour) - 1;
          hoursData[hourIndex] = hour.T_Coef;
        });
      }

      // Push the formatted day and its hours data to tableData
      tableData.push({
        [formattedDay]: hoursData,
      });
    }

    setData((prevData) => ({
      ...prevData,
      tableData: tableData,
    }));

    console.log("Table data generated:", tableData);
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

        <VolumesTable
          selectedMonth={selectedMonth}
          data={data}
          setData={setData}
          loading={loading} // Pass the loading state to the table
        />
      </div>
    </div>
  );
};

export default Volumes;

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
    subject_type: "ЭПО",
    days: [],
    hours: [],
  });

  const [loading, setLoading] = useState(false); // Loading state

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
        provider: providersResponse.data.length > 0 ? providersResponse.data[0].id : 0,
        subject: subjectsResponse.data.length > 0 ? subjectsResponse.data[0].id : 0,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchDays = async () => {
    setLoading(true); // Start loading
    try {
      const startDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-01`;
      const endDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-${new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate()}`;

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

        // Generate empty days for the month
        for (let day = 1; day <= daysInMonth; day++) {
          const formattedDay = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          emptyDays.push({ date: formattedDay });
        }

        // Generate table data with zeroes (hours data is empty)
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

    // Get total days in the selected month
    const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();

    // Loop through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDay = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Find the corresponding day data using the normalized date
      const dayData = days.find((d) => {
        // Normalize the day date (if it comes with a time part)
        const normalized = new Date(d.date).toISOString().split("T")[0];
        return normalized === formattedDay;
      });

      // Initialize an array of zeroes for 24 hours
      const hoursData = new Array(24).fill(0);

      if (dayData) {
        // Find all hours for this day by matching the normalized date from the hours data
        const dayHours = hours.filter((hour) => {
          const hourDate = new Date(hour.date).toISOString().split("T")[0];
          return hourDate === formattedDay;
        });

        // Map the found hours to the correct index in the hoursData array
        dayHours.forEach((hour) => {
          const hourIndex = parseInt(hour.hour) - 1;
          hoursData[hourIndex] = hour.Pred_T;
        });
      }

      // Push the formatted day and its hours data to the table data
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

        <IndProvTariffsTable
          selectedMonth={selectedMonth}
          data={data}
          setData={setData}
          loading={loading} // Pass the loading state to the table
        />
      </div>
    </div>
  );
};

export default IndProvTariffs;

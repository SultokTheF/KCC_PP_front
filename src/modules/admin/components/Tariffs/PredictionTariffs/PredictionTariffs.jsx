// PredictionTariffs.js
import { useState, useEffect } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

import Sidebar from "../../Sidebar/Sidebar";
import Calendar from "./Calendar/Calendar";

import PredictionTariffsTable from "./PredictionTariffsTable";

const PredictionTariffs = () => {
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
    tariffs: [],
    tariffType: "EZ_T",
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

  const fetchTariffs = async () => {
    setLoading(true); // Start loading
    try {
      const startDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-01`;
      const endDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-${new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate()}`;

      const tariffsResponse = await axiosInstance.get(endpoints.BASE_TARIFF, {
        params: {
          start_date: startDate,
          end_date: endDate,
          sub: data.subject,
        },
      });

      setData((prevData) => ({
        ...prevData,
        tariffs: tariffsResponse.data,
      }));

      generateTableData(tariffsResponse.data);
    } catch (error) {
      if (error.response && error.response.data.error === "No BaseTariffs found with the provided criteria.") {
        console.warn("No BaseTariffs found, filling table data with zeroes.");
        const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
        const emptyTariffs = [];

        // Generate an empty list of tariffs to fill with zeroes
        for (let day = 1; day <= daysInMonth; day++) {
          const formattedDay = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          emptyTariffs.push({
            date: formattedDay,
            hour: 1, // Start hour at 1
            [data.tariffType]: 0,
          });
        }

        generateTableData(emptyTariffs);
      } else {
        console.error("Error fetching tariffs:", error);
      }
    } finally {
      setLoading(false); // End loading
    }
  };

  const generateTableData = (tariffsData) => {
    const tableData = [];
    const daysInMonth = new Date(
      selectedMonth.year,
      selectedMonth.month + 1,
      0
    ).getDate();

    // Create a mapping from date to an array of 24 hours
    const dateToHoursMap = {};

    // Initialize the map with 0 for each hour
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDay = `${selectedMonth.year}-${String(
        selectedMonth.month + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dateToHoursMap[formattedDay] = new Array(24).fill(0);
    }

    // Now, fill the dateToHoursMap with the data from tariffsData
    tariffsData.forEach((tariff) => {
      const date = tariff.date.split("T")[0]; // Assuming date is in ISO format
      const hourIndex = tariff.hour - 1;
      const tariffValue = tariff[data.tariffType];

      if (dateToHoursMap[date]) {
        dateToHoursMap[date][hourIndex] = tariffValue;
      }
    });

    // Now, convert dateToHoursMap to tableData array
    for (const [date, hours] of Object.entries(dateToHoursMap)) {
      tableData.push({
        [date]: hours,
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
      fetchTariffs();
    }
  }, [selectedMonth, data.subject, data.tariffType]);

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

        <PredictionTariffsTable
          selectedMonth={selectedMonth}
          data={data}
          setData={setData}
          loading={loading} // Pass the loading state to the table
        />
      </div>
    </div>
  );
};

export default PredictionTariffs;

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
    tariffs: [],
    tariffType: "direction", // Using 'direction' for Directions
  });

  const [loading, setLoading] = useState(false);

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
        provider:
          providersResponse.data.length > 0 ? providersResponse.data[0].id : 0,
        subject:
          subjectsResponse.data.length > 0 ? subjectsResponse.data[0].id : 0,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchTariffs = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedMonth.year}-${String(
        selectedMonth.month + 1
      ).padStart(2, "0")}-01`;
      const endDate = `${selectedMonth.year}-${String(
        selectedMonth.month + 1
      ).padStart(2, "0")}-${new Date(
        selectedMonth.year,
        selectedMonth.month + 1,
        0
      ).getDate()}`;

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
      if (
        error.response &&
        error.response.data.error === "No BaseTariffs found with the provided criteria."
      ) {
        console.warn('No BaseTariffs found, filling table data with "NONE".');
        const daysInMonth = new Date(
          selectedMonth.year,
          selectedMonth.month + 1,
          0
        ).getDate();
        const emptyTariffs = [];

        // Generate an empty list of tariffs to fill with "NONE"
        for (let day = 1; day <= daysInMonth; day++) {
          for (let hour = 1; hour <= 24; hour++) {
            const formattedDay = `${selectedMonth.year}-${String(
              selectedMonth.month + 1
            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            emptyTariffs.push({
              date: formattedDay,
              hour: hour,
              direction: "NONE",
            });
          }
        }

        generateTableData(emptyTariffs);
      } else {
        console.error("Error fetching tariffs:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateTableData = (tariffsData) => {
    const tableData = [];
    const daysInMonth = new Date(
      selectedMonth.year,
      selectedMonth.month + 1,
      0
    ).getDate();

    // Create a mapping from date (YYYY-MM-DD) to an array of 24 hours
    const dateToHoursMap = {};

    // Initialize the map with "NONE" for each hour
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDay = `${selectedMonth.year}-${String(
        selectedMonth.month + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dateToHoursMap[formattedDay] = new Array(24).fill("NONE");
    }

    // Populate the map using the new tariffs schema by validating the date field
    tariffsData.forEach((tariff) => {
      if (!tariff.date) return; // Skip if date is missing
      // Normalize the date to YYYY-MM-DD
      const formattedDate = new Date(tariff.date).toISOString().split("T")[0];
      const hourIndex = tariff.hour - 1;
      const direction = tariff.direction;

      if (dateToHoursMap.hasOwnProperty(formattedDate)) {
        dateToHoursMap[formattedDate][hourIndex] = direction;
      }
    });

    // Convert the mapping into the tableData array
    for (const [date, hours] of Object.entries(dateToHoursMap)) {
      tableData.push({
        [date]: hours,
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
    if (data.subject) {
      fetchTariffs();
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
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Directions;

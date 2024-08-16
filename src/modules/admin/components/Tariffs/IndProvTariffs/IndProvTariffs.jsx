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
        subjects: subjectsResponse.data.filter(subject => subject.subject_type === "ЭПО"),
        providers: providersResponse.data,
        provider: providersResponse.data.length > 0 ? providersResponse?.data[0].id : 0,
        subject: subjectsResponse.data.filter(subject => subject.subject_type === "ЭПО").length > 0 ? subjectsResponse?.data[0].id : 0,
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchDays = async () => {
    try {
      const startDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;
      const endDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate()}`;

      const daysResponse = await axiosInstance.get(endpoints.DAYS, {
        params: {
          start_date: startDate,
          end_date: endDate,
          subject: data.subject,
        },
      });

      setData((prevData) => ({
        ...prevData,
        days: daysResponse.data,
      }));

      fetchHours(daysResponse.data);
    } catch (error) {
      console.error('Error fetching days:', error);
    }
  };

  const fetchHours = async (filteredDays) => {
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

      setData((prevData) => ({
        ...prevData,
        hours: hoursResponse.data,
      }));

      generateTableData(filteredDays, hoursResponse.data);
    } catch (error) {
      if (error.response && error.response.data.error === "No hours found with the provided criteria.") {
        console.warn('No hours found, filling table data with "0".');
        generateTableData(filteredDays, []);
      } else {
        console.error('Error fetching hours:', error);
      }
    }
  };

  const generateTableData = (filteredDays, hours) => {
    const tableData = [];
    const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDay = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = filteredDays.find(d => d.date.split('T')[0] === formattedDay);
      const hoursData = new Array(24).fill(0);

      if (dayData) {
        const dayHours = hours.filter(hour => hour.day === dayData.id);
        dayHours.forEach((hour) => {
          const hourIndex = parseInt(hour.hour) - 1;
          hoursData[hourIndex] = hour.Ind_Prov_T;
        });
      }

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

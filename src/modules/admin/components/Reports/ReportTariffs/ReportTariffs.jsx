import { useState, useEffect } from "react";

import Sidebar from "../../Sidebar/Sidebar";
import Calendar from "./Calendar/Calendar";

import ReportTariffsTable from "./ReportTariffsTable";

import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

const ReportTariffs = () => {
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [data, setData] = useState({
    subjects: [],
    hours: [],
    subject: 0, // Default subject value as 0
    hour: 1,
  });

  const fetchData = async () => {
    try {
      const holidaysResponse = await axiosInstance.get(endpoints.HOLIDAYS);
      const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);

      setHolidays(holidaysResponse.data);
      setData((prevData) => ({
        ...prevData,
        subjects: subjectsResponse.data,
        subject: 0, // Set default subject value as 0
      }));

      // Now that the data is fetched, trigger the fetchHours
      fetchHours(subjectsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchHours = async (subjects = data.subjects) => {
    try {
      if (parseInt(data.subject) === 0 && subjects.length > 0) {
        // Fetch hours for all subjects if subject is 0
        const hoursPromises = subjects.map((subject) =>
          axiosInstance.get(endpoints.HOURS, {
            params: {
              sub: subject.id,
              day: selectedDate,
            },
          }).then(response => ({ subject: subject.id, hours: response.data }))
        );

        const hoursResponses = await Promise.all(hoursPromises);
        const combinedHours = hoursResponses.flatMap((response) => response);

        setData((prevData) => ({
          ...prevData,
          hours: combinedHours,
        }));

        console.log('Combined hours with subjects:', combinedHours);
      } else if (data.subject !== 0) {
        // Fetch hours for the selected subject only
        const hoursResponse = await axiosInstance.get(endpoints.HOURS, {
          params: {
            sub: data.subject,
            day: selectedDate,
          },
        });

        const combinedHours = [{ subject: parseInt(data.subject), hours: hoursResponse.data }];

        setData((prevData) => ({
          ...prevData,
          hours: combinedHours,
        }));

        console.log('Hours with subject:', combinedHours);
      }
    } catch (error) {
      console.error('Error fetching hours:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Ensure fetchHours is only called when subjects have been fetched
    if (data.subjects.length > 0) {
      fetchHours();
    }
  }, [selectedDate, data.subject]);

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Calendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          holidays={holidays}
          data={data}
          setData={setData}
        />

        <ReportTariffsTable data={data} selectedHour={data.hour} selectedDate={selectedDate} />
      </div>
    </div>
  );
};

export default ReportTariffs;

import { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { axiosInstance, endpoints } from "../../../../services/apiConfig";

import Sidebar from "../Sidebar/Sidebar";
import Calendar from "../Calendar/Calendar";
import SubjectTable from "./SubjectsTable/SubjectsTable";

const Dashboard = () => {
  const { user } = useAuth();

  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [daysList, setDaysList] = useState([]);
  const [hoursList, setHoursList] = useState([]);
  const [holidaysList, setHolidaysList] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [selectedData, setSelectedData] = useState({
    selectedSubject: 0,
    selectedObject: 0,
  });

  const fetchData = async () => {
    try {
      const [subjectsResponse, objectsResponse, holidaysResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS),
        axiosInstance.get(endpoints.OBJECTS),
        axiosInstance.get(endpoints.HOLIDAYS)
      ]);

      setSubjectsList(subjectsResponse.data);
      const filteredObjects = objectsResponse.data.filter((object) => object.users.includes(user.id));
      setObjectsList(filteredObjects);
      setHolidaysList(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchDaysAndHours = async () => {
    if (selectedDate) {
      try {
        const dayPromises = subjectsList.map(subject =>
          axiosInstance.get(endpoints.DAYS, {
            params: {
              day: selectedDate,
              sub: subject.id,
            }
          }).catch((error) => {
            if (error.response && error.response.status === 404) {
              return { data: [] };  // Return an empty array if no days are found
            }
            throw error;
          })
        );

        const daysResponses = await Promise.all(dayPromises);
        const allDays = daysResponses.map(response => response.data).flat();

        if (selectedData.selectedSubject) {
          const hoursResponse = await axiosInstance.get(endpoints.HOURS, {
            params: {
              day: selectedDate,
              sub: selectedData.selectedSubject,
            }
          }).catch((error) => {
            if (error.response && error.response.status === 404) {
              return { data: [] };  // Return an empty array if no hours are found
            }
            throw error;
          });
          setHoursList(hoursResponse.data);
        } else {
          setHoursList([]);  // Set empty if no selected subject
        }

        setDaysList(allDays);
      } catch (error) {
        console.error('Error fetching days and hours:', error);
        setDaysList([]);  // Reset days list to empty on error
        setHoursList([]);  // Reset hours list to empty on error
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchDaysAndHours();
  }, [selectedDate, selectedData.selectedSubject, subjectsList]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Calendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          holidays={holidaysList}
        />

        <div className="flex-1 m-2">
          <SubjectTable
            selectedData={selectedData}
            setSelectedData={setSelectedData}
            subjectsList={subjectsList}
            daysList={daysList}
            hoursList={hoursList}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

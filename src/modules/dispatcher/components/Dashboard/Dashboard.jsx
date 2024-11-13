import { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { axiosInstance, endpoints } from "../../../../services/apiConfig";

import Sidebar from "../Sidebar/Sidebar";
import Calendar from "../Calendar/Calendar";
import SubjectTable from "./SubjectsTable/SubjectsTable";
import ObjectTable from "./SubjectsTable/ObjectsTable";

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
      const [subjectsResponse, holidaysResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS),
        axiosInstance.get(endpoints.OBJECTS),
        axiosInstance.get(endpoints.HOLIDAYS)
      ]);

      setSubjectsList(subjectsResponse.data);
      setHolidaysList(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchObjects = async () => {
    if (selectedData.selectedSubject) {
      try {
        const objectsResponse = await axiosInstance.get(endpoints.OBJECTS, {
          params: { sub: selectedData.selectedSubject },
        });
        setObjectsList(objectsResponse.data);
      } catch (error) {
        console.error('Error fetching objects:', error);
        setObjectsList([]);  // Reset objects list to empty on error
      }
    } else {
      setObjectsList([]);
    }
  };

  const fetchDaysAndHours = async () => {
    if (selectedDate && selectedData.selectedSubject) {
      try {
        // Fetch days
        const daysResponse = await axiosInstance.get(endpoints.DAYS, {
          params: {
            day: selectedDate,
            sub: selectedData.selectedSubject,
          }
        }).catch((error) => {
          if (error.response && error.response.status === 404) {
            return { data: [] };  // Return an empty array if no days are found
          }
          throw error;
        });
        const allDays = daysResponse.data || [];
        setDaysList(allDays);

        // Fetch hours
        if (allDays.length > 0) {
          const dayPlan = allDays[0];  // Assuming the first dayPlan
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
          setHoursList([]);  // No dayPlan, so no hours
        }
      } catch (error) {
        console.error('Error fetching days and hours:', error);
        setDaysList([]);  // Reset days list to empty on error
        setHoursList([]);  // Reset hours list to empty on error
      }
    } else {
      setDaysList([]);
      setHoursList([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchObjects();
  }, [selectedData.selectedSubject, selectedDate]);

  useEffect(() => {
    fetchDaysAndHours();
  }, [selectedDate, selectedData.selectedSubject]);

  // Ensure the selected subject is set only once if not already set
  useEffect(() => {
    if (subjectsList.length > 0 && !selectedData.selectedSubject) {
      setSelectedData((prevData) => ({
        ...prevData,
        selectedSubject: subjectsList[0].id
      }));
    }
  }, [subjectsList, setSelectedData]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Calendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          holidays={holidaysList}
        />

        <div className="flex">
          <div className="w-1/2 m-2">
            <SubjectTable
              selectedData={selectedData}
              setSelectedData={setSelectedData}
              subjectsList={subjectsList}
              daysList={daysList}
              hoursList={hoursList}
              selectedDate={selectedDate}
            />
          </div>
          <div className="w-1/2 m-2">
            {/* <ObjectTable
              selectedData={selectedData}
              setSelectedData={setSelectedData}
              objectsList={objectsList}
              selectedDate={selectedDate}
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

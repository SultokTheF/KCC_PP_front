import React, { useState, useEffect } from "react";

import Calendar from "../Calendar/Calendar";
import Sidebar from "../Sidebar/Sidebar";
import SubjectTable from "./SubjectsTable/SubjectTable";
import ObjectTable from "./SubjectsTable/ObjectsTable";

import { axiosInstance, endpoints } from "../../../../services/apiConfig";
import { useAuth } from "../../../../hooks/useAuth";

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
      const [subjectsResponse, objectsResponse, daysResponse, hoursResponse, holidaysResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS),
        axiosInstance.get(endpoints.OBJECTS),
        axiosInstance.get(endpoints.DAYS),
        axiosInstance.get(endpoints.HOURS),
        axiosInstance.get(endpoints.HOLIDAYS)
      ]);

      const filteredSubjects = subjectsResponse.data.filter((subject) => subject.users.includes(user.id));
      setSubjectsList(filteredSubjects);

      const filteredObjects = objectsResponse.data.filter((object) => object.users.includes(user.id));
      setObjectsList(filteredObjects);

      setDaysList(daysResponse.data);
      setHoursList(hoursResponse.data);
      setHolidaysList(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="w-screen">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Calendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            holidays={holidaysList}
          />


          <div className="flex">
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
            <div className="flex-1 m-2">
              <ObjectTable
                selectedData={selectedData}
                setSelectedData={setSelectedData}
                objectsList={objectsList}
                daysList={daysList}
                hoursList={hoursList}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard
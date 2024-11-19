// Dashboard.js

import { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { axiosInstance, endpoints } from "../../../../services/apiConfig";

import Sidebar from "../Sidebar/Sidebar";
import Calendar from "../Calendar/Calendar";
import CombinedTable from "./SubjectsTable/CombinedTable";

const Dashboard = () => {
  const { user } = useAuth();

  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [holidaysList, setHolidaysList] = useState([]);

  const [selectedDate, setSelectedDate] = useState(() => {
    return localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
  });

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
      setObjectsList(objectsResponse.data);
      setHolidaysList(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ensure the selected subject is set only once if not already set
  useEffect(() => {
    if (subjectsList.length > 0 && !selectedData.selectedSubject) {
      setSelectedData((prevData) => ({
        ...prevData,
        selectedSubject: subjectsList[0].id
      }));
    }
  }, [subjectsList]);

  // Set default selected object if not already selected
  useEffect(() => {
    const objects = objectsList.filter(object => object.subject === selectedData.selectedSubject);
    if (!selectedData.selectedObject && objects.length > 0) {
      setSelectedData(prevData => ({
        ...prevData,
        selectedObject: objects[0]?.id || 0,
      }));
    }
  }, [selectedData.selectedSubject, objectsList]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Calendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          holidays={holidaysList}
        />

        <div className="m-2">
          <CombinedTable
            selectedData={selectedData}
            setSelectedData={setSelectedData}
            subjectsList={subjectsList}
            objectsList={objectsList}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

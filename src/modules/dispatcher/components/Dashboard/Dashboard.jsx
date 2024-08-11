import { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { axiosInstance, endpoints } from "../../../../services/apiConfig";

import Sidebar from "../Sidebar/Sidebar";
import Calendar from "../Calendar/Calendar";

import SubjectTable from "./SubjectsTable/SubjectsTable";

const Dashboard = () => {
  const getStatus = (subject) => {
    const day = daysList.find(day => day.subject === subject && day.date.split('T')[0] === selectedDate.split('T')[0])

    if (day?.status === "PRIMARY_PLAN") {
      return "-П1-"
    } else if (day?.status === "KCCPP_PLAN") {
      return "-П1-П2-"
    } else if (day?.status === "KEGOS_PLAN") {
      return "-П1-П2-П3-"
    } else if (day?.status === "FACT1") {
      return "-П1-П2-П3-Ф-"
    } else if (day?.status === "FACT2") {
      return "-П1-П2-П3-Ф-"
    } else if (day?.status === "COMPLETED") {
      return "-П1-П2-П3-Ф-"
    }

    return "-";
  }

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

      setSubjectsList(subjectsResponse.data);

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
}

export default Dashboard;
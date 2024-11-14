// src/components/Dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { axiosInstance, endpoints } from '../../../../services/apiConfig';

import Sidebar from '../Sidebar/Sidebar';
import Calendar from '../Calendar/Calendar';
import SubjectTable from './SubjectsTable/SubjectTable';
import ObjectTable from './SubjectsTable/ObjectsTable';

const Dashboard = () => {
  const { user } = useAuth();

  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [holidaysList, setHolidaysList] = useState([]);

  const [selectedDate, setSelectedDate] = useState(() => {
    // Initialize selectedDate from localStorage or default to today
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
        axiosInstance.get(endpoints.HOLIDAYS),
      ]);

      const filteredSubjects = subjectsResponse.data.filter(subject => subject.users.includes(user.id));
      setSubjectsList(filteredSubjects);

      const filteredObjects = objectsResponse.data.filter(object => object.users.includes(user.id));
      setObjectsList(filteredObjects);

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
                selectedDate={selectedDate}
              />
            </div>
            <div className="flex-1 m-2">
              <ObjectTable
                selectedData={selectedData}
                setSelectedData={setSelectedData}
                objectsList={objectsList}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

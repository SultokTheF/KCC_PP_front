import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import Sidebar from '../../Sidebar/Sidebar';

// Register necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Graphs = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [daysList, setDaysList] = useState([]);
  const [hoursList, setHoursList] = useState([]);

  const [formData, setFormData] = useState({
    object: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    subject: 0,
  });

  const [selectedParameters, setSelectedParameters] = useState({
    P1: true,
    P2: true,
    P3: true,
    F1: true,
    F2: true,
  });

  // Fetch subjects and objects
  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const [subjectsResponse, objectsResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS, { headers: { Authorization: `Bearer ${accessToken}` } }),
        // axiosInstance.get(endpoints.OBJECTS, { headers: { Authorization: `Bearer ${accessToken}` }, params: { sub: 1 } }),
      ]);

      setSubjectsList(subjectsResponse.data);
      // setObjectsList(objectsResponse.data);
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  const fetchObjects = async (subjectId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const objectsResponse = await axiosInstance.get(endpoints.OBJECTS, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { sub: parseInt(subjectId) },
      });
      setObjectsList(objectsResponse.data);
    } catch (error) {
      console.error('Ошибка при получении объектов:', error);
    }
  };

  const fetchDays = async (subjectId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const daysResponse = await axiosInstance.get(endpoints.DAYS, { headers: { Authorization: `Bearer ${accessToken}` } });
      const filteredDays = daysResponse.data.filter(day => day.subject === subjectId);
      setDaysList(filteredDays);
    } catch (error) {
      console.error('Ошибка при получении дней:', error);
    }
  };

  const fetchHoursForObject = async (objectId, startDate, endDate) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axiosInstance.get(endpoints.HOURS, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { obj: objectId, start_date: startDate, end_date: endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении часов:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.subject) {
      fetchObjects(parseInt(formData.subject));
    }
  }, [formData.subject]);

  useEffect(() => {
    if (formData.subject) {
      fetchDays(parseInt(formData.subject));
    }
  }, [formData.subject]);

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.subject) {
      handleFetchHoursForObjects();
    }
  }, [formData.startDate, formData.endDate, selectedObjects]);

  const handleFetchHoursForObjects = async () => {
    let totalHours = Array(24).fill({ P1: 0, P2: 0, P3: 0, F1: 0, F2: 0 });
  
    for (const objectId of selectedObjects) {
      const objectHours = await fetchHoursForObject(objectId, formData.startDate, formData.endDate);
  
      objectHours.forEach((hourData, index) => {
        totalHours[index] = {
          P1: totalHours[index].P1 + (hourData.P1 - hourData.P1_Gen),
          P2: totalHours[index].P2 + (hourData.P2 - hourData.P2_Gen),
          P3: totalHours[index].P3 + (hourData.P3 - hourData.P3_Gen),
          F1: totalHours[index].F1 + (hourData.F1 - hourData.F1_Gen),
          F2: totalHours[index].F2 + (hourData.F2 - hourData.F2_Gen),
        };
      });
    }
  
    setHoursList(totalHours);
  };
  

  const handleChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleObjectSelect = (objectId) => {
    setSelectedObjects(prevState =>
      prevState.includes(objectId)
        ? prevState.filter(id => id !== objectId)
        : [...prevState, objectId]
    );
  };

  const generateDataSet = (parameter, label, color) => ({
    label,
    data: hoursList.map(hour => hour[parameter] || 0),
    fill: false,
    borderColor: color,
  });

  const chartData = {
    labels: hoursList.map((_, index) => index + 1), // X-axis labels
    datasets: [
      selectedParameters.P1 && generateDataSet('P1', 'P1', 'rgba(75,192,192,1)'),
      selectedParameters.P2 && generateDataSet('P2', 'P2', 'rgba(153,102,255,1)'),
      selectedParameters.P3 && generateDataSet('P3', 'P3', 'rgba(255,159,64,1)'),
      selectedParameters.F1 && generateDataSet('F1', 'F1', 'rgba(255,99,132,1)'),
      selectedParameters.F2 && generateDataSet('F2', 'F2', 'rgba(54,162,235,1)'),
    ].filter(Boolean),
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Графики</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Line data={chartData} />
        </div>

        {/* Subject Selector */}
        <div className="flex flex-col md:flex-row justify-between mt-8 space-y-4 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-1/3">
            <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
              Выберите субъект
            </label>
            <select
              name="subject"
              id="subject"
              className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-full text-gray-700 font-medium mb-2"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              required
            >
              <option value={0}>Субъект</option>
              {subjectsList?.map(subj => (
                <option key={subj.id} value={subj.id}>
                  {subj.subject_name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date Selector */}
          <div className="w-full md:w-1/3">
            <label htmlFor="startDate" className="block text-gray-700 font-medium mb-2">
              Дата начала
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              className="h-10 border border-gray-300 rounded px-4 focus:outline-none focus:border-blue-500 w-full"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
          </div>

          {/* End Date Selector */}
          <div className="w-full md:w-1/3">
            <label htmlFor="endDate" className="block text-gray-700 font-medium mb-2">
              Дата окончания
            </label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              className="h-10 border border-gray-300 rounded px-4 focus:outline-none focus:border-blue-500 w-full"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Objects List as Checkboxes */}
        <div className="mt-4">
          <label className="block text-gray-700 font-medium mb-2">
            Выберите объекты
          </label>
          <div className="grid grid-cols-2 gap-4">
            {objectsList.map(obj => (
              <div key={obj.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`object_${obj.id}`}
                  checked={selectedObjects.includes(obj.id)}
                  onChange={() => handleObjectSelect(obj.id)}
                  className="mr-2"
                />
                <label htmlFor={`object_${obj.id}`} className="text-gray-700">
                  {obj.object_name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Graphs;

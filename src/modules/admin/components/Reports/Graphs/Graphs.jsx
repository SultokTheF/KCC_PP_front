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

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const [subjectsResponse, objectsResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS, { headers: { Authorization: `Bearer ${accessToken}` } }),
        axiosInstance.get(endpoints.OBJECTS, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      setSubjectsList(subjectsResponse.data);
      setObjectsList(objectsResponse.data);
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
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

  const fetchHours = async (startDate, endDate, subject) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axiosInstance.get(endpoints.HOURS, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate,
          end_date: endDate,
          sub: subject,
        },
      });

      if (!response.data || response.data.error || response.data.length === 0) {
        console.error('Ошибка при получении часов:', response.data.error || 'Часы не найдены с указанными критериями.');
        setHoursList([]);
        return;
      }

      const hoursData = response.data;

      const processedHours = hoursData.map(hour => ({
        ...hour,
        F1: hour.F1 - hour.F1_Gen,
        F2: hour.F2 - hour.F2_Gen,
        P1: hour.P1 - hour.P1_Gen,
        P2: hour.P2 - hour.P2_Gen,
        P3: hour.P3 - hour.P3_Gen,
      }));

      setHoursList(processedHours);
    } catch (error) {
      console.error('Ошибка при получении часов:', error);
      setHoursList([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.subject) {
      fetchDays(parseInt(formData.subject));
    }
  }, [formData.subject]);

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.subject) {
      fetchHours(formData.startDate, formData.endDate, formData.subject);
    }
  }, [formData.startDate, formData.endDate, formData.subject]);

  const handleChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
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
      </div>
    </div>
  );
};

export default Graphs;

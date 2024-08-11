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

import { useAuth } from '../../../../hooks/useAuth';
import { axiosInstance, endpoints } from '../../../../services/apiConfig';
import Sidebar from '../Sidebar/Sidebar';

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
  const { user } = useAuth();

  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [daysList, setDaysList] = useState([]);
  const [hoursList, setHoursList] = useState([]);

  const [subjectType, setSubjectType] = useState();

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
    P1_Gen: false,
    P2_Gen: false,
    P3_Gen: false,
    F1_Gen: false,
  });

  const fetchData = async () => {
    try {
      const [subjectsResponse, objectsResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS),
        axiosInstance.get(endpoints.OBJECTS),
      ]);

      const filteredSubjects = subjectsResponse.data.filter((subject) => subject.users.includes(user.id));
      setSubjectsList(filteredSubjects);
      
      setObjectsList(objectsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchDays = async (subjectId) => {
    try {
      const daysResponse = await axiosInstance.get(endpoints.DAYS);
      const filteredDays = daysResponse.data.filter(day => day.subject === subjectId);
      setDaysList(filteredDays);
    } catch (error) {
      console.error('Error fetching days:', error);
    }
  };

  const fetchHours = async (startDate, endDate) => {
    try {
      const hoursResponse = await axiosInstance.get(endpoints.HOURS);
      const filteredHours = hoursResponse.data.filter(hour => {
        const day = daysList.find(d => d.id === hour.day);
        return day && new Date(day.date) >= new Date(startDate) && new Date(day.date) <= new Date(endDate);
      });

      const dateArray = [];
      let currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        dateArray.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const dayHourMap = {};
      dateArray.forEach(date => {
        dayHourMap[date] = Array(24).fill().map((_, hour) => ({
          hour, P1: 0, P2: 0, P3: 0, F1: 0,
          P1_Gen: 0, P2_Gen: 0, P3_Gen: 0, F1_Gen: 0,
        }));
      });

      filteredHours.forEach(hour => {
        const day = daysList.find(d => d.id === hour.day);
        const dayDate = new Date(day.date).toISOString().split('T')[0];
        dayHourMap[dayDate][hour.hour - 1] = hour;
      });

      const flattenedHours = [];
      Object.keys(dayHourMap).forEach(dayDate => {
        dayHourMap[dayDate].forEach(hour => {
          flattenedHours.push(hour);
        });
      });

      setHoursList(flattenedHours);
    } catch (error) {
      console.error('Error fetching hours:', error);
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
      fetchHours(formData.startDate, formData.endDate);
    }
  }, [formData.startDate, formData.endDate, formData.subject, daysList]);

  const handleChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name) => {
    setSelectedParameters(prevParams => ({
      ...prevParams,
      [name]: !prevParams[name]
    }));
  };

  const generateDataSet = (parameter, label, color) => {
    return {
      label,
      data: hoursList.map(hour => hour[parameter] || 0),
      fill: false,
      borderColor: color,
    };
  };

  useEffect(() => {
    setSubjectType(subjectsList.find(sub => sub.id === parseInt(formData.subject))?.subject_type);
}, [formData.subject])

  const chartData = {
    labels: hoursList.map((_, index) => index + 1), // X-axis labels
    datasets: [
      selectedParameters.P1 && generateDataSet('P1', 'P1', 'rgba(75,192,192,1)'),
      selectedParameters.P2 && generateDataSet('P2', 'P2', 'rgba(153,102,255,1)'),
      selectedParameters.P3 && generateDataSet('P3', 'P3', 'rgba(255,159,64,1)'),
      selectedParameters.F1 && generateDataSet('F1', 'F1', 'rgba(255,99,132,1)'),
      subjectType === "ЭПО" && selectedParameters.P1_Gen && generateDataSet('P1_Gen', 'P1_Gen', 'rgba(255,206,86,1)'),
      subjectType === "ЭПО" && selectedParameters.P2_Gen && generateDataSet('P2_Gen', 'P2_Gen', 'rgba(75,192,192,0.5)'),
      subjectType === "ЭПО" && selectedParameters.P3_Gen && generateDataSet('P3_Gen', 'P3_Gen', 'rgba(153,102,255,0.5)'),
      subjectType === "ЭПО" && selectedParameters.F1_Gen && generateDataSet('F1_Gen', 'F1_Gen', 'rgba(255,99,132,0.5)')
    ].filter(Boolean)
  };

  return (
    <div className="flex">
      <Sidebar/>
      <div className='flex-1 p-4'>
        <Line data={chartData} />
        <div className="flex ml-10">
          <div className="w-1/4">
            <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
              Выберите субъект
            </label>
            <select
              name="subject"
              id="subject"
              className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-11/12 text-gray-700 font-medium mb-2"
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
          <div className="w-1/4">
            <label htmlFor="startDate" className="block text-gray-700 font-medium mb-2">
              Выберите дату начала
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              className="h-10 border border-gray-300 rounded px-4 focus:outline-none focus:border-blue-500"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
          </div>
          <div className="w-1/4">
            <label htmlFor="endDate" className="block text-gray-700 font-medium mb-2">
              Выберите дату окончания
            </label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              className="h-10 border border-gray-300 rounded px-4 focus:outline-none focus:border-blue-500"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex ml-10 mt-4">
          {["P1", "P2", "P3", "F1"].map(param => (
            <div className="w-1/4" key={param}>
              <label className="block text-gray-700 font-medium mb-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedParameters[param]}
                  onChange={() => handleCheckboxChange(param)}
                />
                {param}
              </label>
            </div>
          ))}
          {subjectType === "ЭПО" && ["P1_Gen", "P2_Gen", "P3_Gen", "F1_Gen"].map(param => (
            <div className="w-1/4" key={param}>
              <label className="block text-gray-700 font-medium mb-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedParameters[param]}
                  onChange={() => handleCheckboxChange(param)}
                />
                {param}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Graphs;

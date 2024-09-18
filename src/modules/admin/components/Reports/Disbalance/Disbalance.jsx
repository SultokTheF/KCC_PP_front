import React, { useState, useEffect, useCallback } from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Time intervals for hours
const timeIntervals = [
  '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
  '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
  '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
  '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00',
];

const Graphs = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [hoursList, setHoursList] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingHours, setIsLoadingHours] = useState(false);

  const [formData, setFormData] = useState({
    object: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    subject: '',
  });

  const [selectedParameters, setSelectedParameters] = useState({
    P1: true,
    P2: true,
    P3: true,
    F1: true,
    F2: true,
  });

  // Fetch subjects list
  const fetchSubjects = async () => {
    try {
      const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
      setSubjectsList(subjectsResponse.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to load subjects.');
    }
  };

  // Fetch objects based on the selected subject
  const fetchObjects = async (subjectId) => {
    try {
      const objectsResponse = await axiosInstance.get(endpoints.OBJECTS, {
        params: { sub: subjectId },
      });
      setObjectsList(objectsResponse.data);
      setSelectedObjects(objectsResponse.data.map((obj) => obj.id)); // Select all objects by default
    } catch (error) {
      console.error('Error fetching objects:', error);
      setError('Failed to load objects.');
    }
  };

  // Generate date array based on the start and end date
  const generateDateArray = (startDate, endDate) => {
    const dateArray = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dateArray.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

  // Fetch hours data and aggregate for selected objects
  const fetchHoursData = useCallback(async () => {
    if (!formData.subject || !formData.startDate || !formData.endDate) {
      setHoursList([]);
      return;
    }

    setIsLoadingHours(true);

    try {
      const dateArray = generateDateArray(formData.startDate, formData.endDate);
      const totalDays = dateArray.length;

      // Fetch hours for all selected objects across all days
      const hoursPromises = selectedObjects.map((objId) =>
        axiosInstance
          .get(endpoints.HOURS, {
            params: {
              obj: objId,
              start_date: formData.startDate,
              end_date: formData.endDate,
            },
          })
          .then((response) => response.data)
          .catch((error) => {
            console.warn(`Error fetching hours for object ${objId}, using default zeros.`);
            // Return zero values if fetching fails
            const defaultHours = Array.from({ length: totalDays * 24 }, (_, idx) => ({
              hour: idx % 24 + 1,
              P1: 0, P1_Gen: 0, P2: 0, P2_Gen: 0, P3: 0, P3_Gen: 0, F1: 0, F1_Gen: 0, F2: 0, F2_Gen: 0,
            }));
            return defaultHours;
          })
      );

      const hoursResults = await Promise.all(hoursPromises);

      // Aggregate and sum up the data
      const totalHoursList = sumHoursForSelectedObjects(hoursResults, totalDays);
      setHoursList(totalHoursList);
    } catch (error) {
      console.error('Error fetching hours data:', error);
      setError('Failed to load hourly data.');
    } finally {
      setIsLoadingHours(false);
    }
  }, [formData.startDate, formData.endDate, formData.subject, selectedObjects]);

  // Aggregate hours across selected objects
  const sumHoursForSelectedObjects = (hoursResults, totalDays) => {
    const totalHoursList = Array.from({ length: totalDays * 24 }, () => ({
      P1: 0, P2: 0, P3: 0, F1: 0, F2: 0,
    }));

    hoursResults.forEach((objectHours) => {
      objectHours.forEach((hourData, idx) => {
        totalHoursList[idx].P1 = Math.max(totalHoursList[idx].P1 + (hourData.P1 - hourData.P1_Gen), 0);
        totalHoursList[idx].P2 = Math.max(totalHoursList[idx].P2 + (hourData.P2 - hourData.P2_Gen), 0);
        totalHoursList[idx].P3 = Math.max(totalHoursList[idx].P3 + (hourData.P3 - hourData.P3_Gen), 0);
        totalHoursList[idx].F1 = Math.max(totalHoursList[idx].F1 + (hourData.F1 - hourData.F1_Gen), 0);
        totalHoursList[idx].F2 = Math.max(totalHoursList[idx].F2 + (hourData.F2 - hourData.F2_Gen), 0);
      });
    });

    return totalHoursList;
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (formData.subject) {
      fetchObjects(formData.subject);
    }
  }, [formData.subject]);

  useEffect(() => {
    fetchHoursData();
  }, [fetchHoursData]);

  const generateDataSet = (parameter, label, color) => ({
    label,
    data: hoursList.map((hour) => hour[parameter] || 0),
    fill: false,
    borderColor: color,
  });

  const chartData = {
    labels: hoursList.map((_, index) => `${Math.floor(index / 24)}:${index % 24}`), // X-axis labels (days and hours)
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

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          {isLoadingHours ? (
            <div>Загрузка данных графика...</div>
          ) : hoursList && hoursList.length > 0 ? (
            <Line data={chartData} />
          ) : (
            <div>Нет данных для выбранных параметров.</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between mt-8 space-y-4 md:space-y-0 md:space-x-4">
          {/* Subject selection, date range, object selection... */}
        </div>
      </div>
    </div>
  );
};

export default Graphs;

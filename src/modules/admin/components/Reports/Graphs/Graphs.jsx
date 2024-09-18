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

const Graphs = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [hoursList, setHoursList] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingHours, setIsLoadingHours] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
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

  // Fetch hours data for the selected objects
  const fetchHoursData = useCallback(async () => {
    if (!formData.subject || selectedObjects.length === 0 || !formData.startDate || !formData.endDate) {
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

      // Aggregate and sum up the data for the selected objects
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
        totalHoursList[idx].P1 = Math.max(totalHoursList[idx].P1 + Math.abs(hourData.P1 - hourData.P1_Gen), 0);
        totalHoursList[idx].P2 = Math.max(totalHoursList[idx].P2 + Math.abs(hourData.P2 - hourData.P2_Gen), 0);
        totalHoursList[idx].P3 = Math.max(totalHoursList[idx].P3 + Math.abs(hourData.P3 - hourData.P3_Gen), 0);
        totalHoursList[idx].F1 = Math.max(totalHoursList[idx].F1 + Math.abs(hourData.F1 - hourData.F1_Gen), 0);
        totalHoursList[idx].F2 = Math.max(totalHoursList[idx].F2 + Math.abs(hourData.F2 - hourData.F2_Gen), 0);
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

  // Handle subject selection
  const handleSubjectSelection = (e) => {
    setFormData({
      ...formData,
      subject: e.target.value,
    });
  };

  // Handle object checkbox toggle
  const handleObjectToggle = (objId) => {
    setSelectedObjects((prevSelectedObjects) =>
      prevSelectedObjects.includes(objId)
        ? prevSelectedObjects.filter((id) => id !== objId) // Remove unchecked object
        : [...prevSelectedObjects, objId] // Add checked object
    );
  };

  // Generate data sets for graph
  const generateDataSet = (parameter, label, color) => ({
    label,
    data: hoursList.map((hour) => hour[parameter] || 0),
    fill: false,
    borderColor: color,
  });

  // Updated labels based on the total number of hours across selected days
  const totalHours = hoursList.length; // Total hours based on the date range
  const chartLabels = Array.from({ length: totalHours }, (_, index) => index + 1); // Generate labels like 1, 2, 3, ... up to totalHours

  const chartData = {
    labels: chartLabels, // Use the continuous hour labels
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

        {/* Prettier Selectors */}
        <div className="bg-gray-100 p-6 mt-8 rounded-lg shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subject Selector */}
            <div>
              <label htmlFor="subject" className="block text-gray-700 font-semibold mb-2">
                Выберите субъект
              </label>
              <select
                name="subject"
                id="subject"
                className="block h-12 border border-gray-300 rounded-lg px-4 w-full text-gray-700 font-medium focus:outline-none focus:border-blue-500"
                value={formData.subject}
                onChange={handleSubjectSelection}
                required
              >
                <option value="">Субъект</option>
                {subjectsList?.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Selector */}
            <div>
              <label htmlFor="startDate" className="block text-gray-700 font-semibold mb-2">
                Дата начала
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                className="h-12 border border-gray-300 rounded-lg px-4 w-full text-gray-700 font-medium focus:outline-none focus:border-blue-500"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            {/* End Date Selector */}
            <div>
              <label htmlFor="endDate" className="block text-gray-700 font-semibold mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                className="h-12 border border-gray-300 rounded-lg px-4 w-full text-gray-700 font-medium focus:outline-none focus:border-blue-500"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Objects List with Checkboxes */}
          <div>
            <label className="block text-gray-700 font-semibold mb-4">Выберите объекты</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {objectsList.map((obj) => (
                <div key={obj.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`object-${obj.id}`}
                    checked={selectedObjects.includes(obj.id)}
                    onChange={() => handleObjectToggle(obj.id)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`object-${obj.id}`} className="ml-3 text-gray-700">
                    {obj.object_name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Graphs;

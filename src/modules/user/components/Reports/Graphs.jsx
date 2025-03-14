// Graphs.jsx
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
import dayjs from 'dayjs'; // For date parsing/format
import { axiosInstance, endpoints } from '../../../../services/apiConfig';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../../../hooks/useAuth';

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
  const [selectedObjects, setSelectedObjects] = useState([]);

  // We'll store all hours from each object, then group them
  const [allHours, setAllHours] = useState([]);

  // dayMap: dayId -> dayObject from server
  const [dayMap, setDayMap] = useState({});

  const [error, setError] = useState(null);
  const [isLoadingHours, setIsLoadingHours] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    startDate: new Date().toISOString().split('T')[0], // "YYYY-MM-DD"
    endDate: new Date().toISOString().split('T')[0],   // "YYYY-MM-DD"
    startHour: 1,
    endHour: 24,
  });

  // Which lines to show on the chart
  const [selectedParameters, setSelectedParameters] = useState({
    P1: true,
    P2: true,
    P3: true,
    F1: true,
    F2: true,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch Subjects
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchSubjects = async () => {
    try {
      const response = await axiosInstance.get(endpoints.SUBJECTS, {
        params: { user: user.id },
      });
      setSubjectsList(response.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch Objects for a Subject
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchObjects = async (subjectId) => {
    try {
      const response = await axiosInstance.get(endpoints.OBJECTS, {
        params: { sub: subjectId },
      });
      setObjectsList(response.data);
      // By default, select all objects
      setSelectedObjects(response.data.map((obj) => obj.id));
    } catch (err) {
      console.error('Error fetching objects:', err);
      setError('Failed to load objects.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch Hours for Selected Objects
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchHoursData = useCallback(async () => {
    if (
      !formData.subject ||
      selectedObjects.length === 0 ||
      !formData.startDate ||
      !formData.endDate
    ) {
      setAllHours([]);
      setDayMap({});
      return;
    }

    setIsLoadingHours(true);
    setError(null);

    try {
      // 1) For each selected object, fetch hours from startDate to endDate
      const hoursPromises = selectedObjects.map((objId) =>
        axiosInstance
          .get(endpoints.HOURS, {
            params: {
              obj: objId,
              start_date: formData.startDate,
              end_date: formData.endDate,
            },
          })
          .then((response) => response.data || [])
          .catch((error) => {
            console.warn(
              `Error fetching hours for object ${objId}, using empty data.`
            );
            return [];
          })
      );

      // 2) Combine all hours into a single array
      const hoursResults = await Promise.all(hoursPromises);
      // Flatten the arrays of hours
      const combinedHours = hoursResults.flat();
      setAllHours(combinedHours);

      // 3) Fetch day objects for each unique hour.day
      const newDayMap = await fetchDayObjects(combinedHours);
      setDayMap(newDayMap);
    } catch (err) {
      console.error('Error fetching hours data:', err);
      setError('Failed to load hourly data.');
      setAllHours([]);
      setDayMap({});
    } finally {
      setIsLoadingHours(false);
    }
  }, [formData, selectedObjects]);

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch Day Objects
  // ─────────────────────────────────────────────────────────────────────────────
  async function fetchDayObjects(hoursArray) {
    const uniqueDayIds = [...new Set(hoursArray.map((h) => h.day))];
    const dayMapTemp = {};

    for (const dayId of uniqueDayIds) {
      if (!dayId) continue; // In case day is null
      try {
        const response = await axiosInstance.get(`${endpoints.DAYS}${dayId}/`);
        dayMapTemp[dayId] = response.data;
      } catch (err) {
        console.error(`Error fetching day object for dayId=${dayId}:`, err);
        dayMapTemp[dayId] = null;
      }
    }
    return dayMapTemp;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  Summation Logic
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Summation approach:
   * 1) For each hour in allHours, find its real date from dayMap[ hour.day ].date.
   * 2) Convert that date to "YYYY-MM-DD", parse the hour, filter by startHour/endHour if it is the startDate or endDate.
   * 3) Group them by date in an object { dateString: [ hourData, hourData, ... ] }.
   * 4) For each date+hour, sum the absolute differences across objects if you want. But if you already have them in `allHours` as separate rows, you might want to do a reduce pass.
   *
   * We'll do a single pass that merges hours with the same date+hour. Then we sum P1, P2, etc. for that date+hour.
   */
  function groupAndSumHoursByDateAndHour() {
    const grouped = {};

    // Combine hours for each date+hour
    for (const hour of allHours) {
      if (!hour.day) continue; // skip if day is missing
      const dayObj = dayMap[hour.day];
      if (!dayObj) continue; // skip if day object is missing
      const dateStrRaw = dayObj.date; // e.g. "2025-03-13T00:00:00+01:00"
      if (!dateStrRaw) continue;

      // Convert to dayjs
      const dateJs = dayjs(dateStrRaw);
      if (!dateJs.isValid()) continue;

      // Extract "YYYY-MM-DD"
      const datePart = dateJs.format('YYYY-MM-DD');
      const hourNum = hour.hour; // 1..24

      // Filter logic:
      // If datePart == startDate, only include hour >= startHour
      // If datePart == endDate, only include hour <= endHour
      // If datePart is between startDate and endDate, include all
      let includeHour = true;

      // Compare as dayjs for simpler logic
      const startJs = dayjs(formData.startDate);
      const endJs = dayjs(formData.endDate);
      if (dateJs.isSame(startJs, 'day') && dateJs.isSame(endJs, 'day')) {
        // Single day
        includeHour = hourNum >= formData.startHour && hourNum <= formData.endHour;
      } else if (dateJs.isSame(startJs, 'day')) {
        // Start day
        includeHour = hourNum >= formData.startHour;
      } else if (dateJs.isSame(endJs, 'day')) {
        // End day
        includeHour = hourNum <= formData.endHour;
      } else if (dateJs.isBefore(startJs, 'day')) {
        includeHour = false;
      } else if (dateJs.isAfter(endJs, 'day')) {
        includeHour = false;
      }

      if (!includeHour) {
        continue;
      }

      // Now group by datePart
      if (!grouped[datePart]) {
        grouped[datePart] = {};
      }

      // Within that date, group by hour
      if (!grouped[datePart][hourNum]) {
        // We'll store sums
        grouped[datePart][hourNum] = {
          P1: 0,
          P2: 0,
          P3: 0,
          F1: 0,
          F2: 0,
        };
      }

      // Add the absolute difference
      grouped[datePart][hourNum].P1 += Math.max(
        Math.abs(hour.P1 - hour.P1_Gen),
        0
      );
      grouped[datePart][hourNum].P2 += Math.max(
        Math.abs(hour.P2 - hour.P2_Gen),
        0
      );
      grouped[datePart][hourNum].P3 += Math.max(
        Math.abs(hour.P3 - hour.P3_Gen),
        0
      );
      grouped[datePart][hourNum].F1 += Math.max(
        Math.abs(hour.F1 - hour.F1_Gen),
        0
      );
      grouped[datePart][hourNum].F2 += Math.max(
        Math.abs(hour.F2 - hour.F2_Gen),
        0
      );
    }

    return grouped;
  }

  // Build chart data from grouped sums
  const buildChartData = () => {
    const grouped = groupAndSumHoursByDateAndHour();

    // We want a sorted array of points
    // sorted by date ascending, then hour ascending
    const dateKeys = Object.keys(grouped).sort(); // "YYYY-MM-DD"
    const chartDataPoints = [];
    const chartLabels = [];

    dateKeys.forEach((dateKey) => {
      const hourMap = grouped[dateKey];
      const hourKeys = Object.keys(hourMap)
        .map(Number)
        .sort((a, b) => a - b); // numeric sort
      hourKeys.forEach((hr) => {
        const hourData = hourMap[hr];
        // We'll push a point for each hour
        chartDataPoints.push({
          date: dateKey,
          hour: hr,
          ...hourData,
        });
        // Label might be "2025-03-13 05:00"
        chartLabels.push(`${dateKey} ${hr}:00`);
      });
    });

    return { chartDataPoints, chartLabels };
  };

  // Create chart dataset for each parameter
  const generateDataSet = (parameter, label, color, dataPoints) => ({
    label,
    data: dataPoints.map((pt) => pt[parameter] || 0),
    fill: false,
    borderColor: color,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  //  useEffects
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  //  Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSubjectSelection = (e) => {
    setFormData({
      ...formData,
      subject: e.target.value,
    });
  };

  const handleObjectToggle = (objId) => {
    setSelectedObjects((prev) =>
      prev.includes(objId) ? prev.filter((id) => id !== objId) : [...prev, objId]
    );
  };

  // Build the final chart data
  const { chartDataPoints, chartLabels } = buildChartData();

  // Prepare the actual data for <Line>
  const chartData = {
    labels: chartLabels,
    datasets: [
      selectedParameters.P1 &&
        generateDataSet('P1', 'P1', 'rgba(75,192,192,1)', chartDataPoints),
      selectedParameters.P2 &&
        generateDataSet('P2', 'P2', 'rgba(153,102,255,1)', chartDataPoints),
      selectedParameters.P3 &&
        generateDataSet('P3', 'P3', 'rgba(255,159,64,1)', chartDataPoints),
      selectedParameters.F1 &&
        generateDataSet('F1', 'F1', 'rgba(255,99,132,1)', chartDataPoints),
      selectedParameters.F2 &&
        generateDataSet('F2', 'F2', 'rgba(54,162,235,1)', chartDataPoints),
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
          ) : chartDataPoints && chartDataPoints.length > 0 ? (
            <Line data={chartData} />
          ) : (
            <div>Нет данных для выбранных параметров.</div>
          )}
        </div>

        {/* Selectors */}
        <div className="bg-gray-100 p-6 mt-8 rounded-lg shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Subject Selector */}
            <div>
              <label
                htmlFor="subject"
                className="block text-gray-700 font-semibold mb-2"
              >
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

            {/* Start Date */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-gray-700 font-semibold mb-2"
              >
                Дата начала
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                className="h-12 border border-gray-300 rounded-lg px-4 w-full text-gray-700 font-medium focus:outline-none focus:border-blue-500"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-gray-700 font-semibold mb-2"
              >
                Дата окончания
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                className="h-12 border border-gray-300 rounded-lg px-4 w-full text-gray-700 font-medium focus:outline-none focus:border-blue-500"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>

            {/* Start Hour */}
            <div>
              <label
                htmlFor="startHour"
                className="block text-gray-700 font-semibold mb-2"
              >
                Час начала
              </label>
              <select
                name="startHour"
                id="startHour"
                className="block h-12 border border-gray-300 rounded-lg px-4 w-full text-gray-700 font-medium focus:outline-none focus:border-blue-500"
                value={formData.startHour}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startHour: parseInt(e.target.value),
                  })
                }
                required
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* End Hour */}
            <div>
              <label
                htmlFor="endHour"
                className="block text-gray-700 font-semibold mb-2"
              >
                Час окончания
              </label>
              <select
                name="endHour"
                id="endHour"
                className="block h-12 border border-gray-300 rounded-lg px-4 w-full text-gray-700 font-medium focus:outline-none focus:border-blue-500"
                value={formData.endHour}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endHour: parseInt(e.target.value),
                  })
                }
                required
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Objects List with Checkboxes */}
          <div>
            <label className="block text-gray-700 font-semibold mb-4">
              Выберите объекты
            </label>
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
                  <label
                    htmlFor={`object-${obj.id}`}
                    className="ml-3 text-gray-700"
                  >
                    {obj.object_name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Parameters Selection */}
        <div className="bg-gray-100 p-6 mt-8 rounded-lg shadow-md">
          <label className="block text-gray-700 font-semibold mb-4">
            Выберите параметры
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.keys(selectedParameters).map((param) => (
              <div key={param} className="flex items-center">
                <input
                  type="checkbox"
                  id={`param-${param}`}
                  checked={selectedParameters[param]}
                  onChange={() =>
                    setSelectedParameters((prev) => ({
                      ...prev,
                      [param]: !prev[param],
                    }))
                  }
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`param-${param}`} className="ml-3 text-gray-700">
                  {param}
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

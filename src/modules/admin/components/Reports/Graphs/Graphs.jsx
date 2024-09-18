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

// Регистрация необходимых компонентов
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

  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingObjects, setIsLoadingObjects] = useState(false);
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  const [error, setError] = useState(null);

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

  // Получение списка субъектов
  const fetchSubjects = async () => {
    setIsLoadingSubjects(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSubjectsList(subjectsResponse.data);
    } catch (error) {
      console.error('Ошибка при получении субъектов:', error);
      setError('Не удалось получить список субъектов.');
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Получение объектов выбранного субъекта
  const fetchObjects = async (subjectId) => {
    setIsLoadingObjects(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const objectsResponse = await axiosInstance.get(endpoints.OBJECTS, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { sub: parseInt(subjectId) },
      });
      setObjectsList(objectsResponse.data);
    } catch (error) {
      console.error('Ошибка при получении объектов:', error);
      setError('Не удалось получить список объектов.');
    } finally {
      setIsLoadingObjects(false);
    }
  };

  // Получение данных по часам для выбранных объектов
  const fetchHoursForObjects = async () => {
    setIsLoadingHours(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('accessToken');

      // Получаем данные по часам для всех выбранных объектов параллельно
      const promises = selectedObjects.map((objectId) =>
        axiosInstance.get(endpoints.HOURS, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            obj: objectId,
            start_date: formData.startDate,
            end_date: formData.endDate,
          },
        })
      );

      const results = await Promise.all(promises);

      // Инициализируем массив totalHours с 24 часами
      let totalHours = Array.from({ length: 24 }, () => ({
        P1: 0,
        P2: 0,
        P3: 0,
        F1: 0,
        F2: 0,
      }));

      // Агрегируем данные от всех объектов
      results.forEach((response) => {
        const data = response.data;
        const objectHours = Array.isArray(data) ? data : [data]; // Убедимся, что это массив

        objectHours.forEach((hourData) => {
          const index = hourData.hour - 1; // Предполагаем, что час от 1 до 24
          totalHours[index] = {
            P1: totalHours[index].P1 + (hourData.P1 - hourData.P1_Gen),
            P2: totalHours[index].P2 + (hourData.P2 - hourData.P2_Gen),
            P3: totalHours[index].P3 + (hourData.P3 - hourData.P3_Gen),
            F1: totalHours[index].F1 + (hourData.F1 - hourData.F1_Gen),
            F2: totalHours[index].F2 + (hourData.F2 - hourData.F2_Gen),
          };
        });
      });

      setHoursList(totalHours);
    } catch (error) {
      console.error('Ошибка при получении данных по часам:', error);
      setError('Не удалось получить данные по часам.');
      setHoursList([]);
    } finally {
      setIsLoadingHours(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (formData.subject) {
      fetchObjects(parseInt(formData.subject));
    } else {
      setObjectsList([]);
      setSelectedObjects([]);
    }
  }, [formData.subject]);

  useEffect(() => {
    if (
      formData.startDate &&
      formData.endDate &&
      formData.subject &&
      selectedObjects.length > 0
    ) {
      fetchHoursForObjects();
    } else {
      setHoursList([]);
    }
  }, [formData.startDate, formData.endDate, selectedObjects]);

  const handleChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleObjectSelect = (objectId) => {
    setSelectedObjects((prevState) =>
      prevState.includes(objectId)
        ? prevState.filter((id) => id !== objectId)
        : [...prevState, objectId]
    );
  };

  const generateDataSet = (parameter, label, color) => ({
    label,
    data: hoursList.map((hour) => hour[parameter] || 0),
    fill: false,
    borderColor: color,
  });

  const chartData = {
    labels: hoursList.map((_, index) => index + 1), // Метки по оси X
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

        {/* Сообщение об ошибке */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {/* Состояние загрузки для графика */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {isLoadingHours ? (
            <div>Загрузка данных графика...</div>
          ) : hoursList && hoursList.length > 0 ? (
            <Line data={chartData} />
          ) : (
            <div>Нет данных для выбранных параметров.</div>
          )}
        </div>

        {/* Выбор субъекта */}
        <div className="flex flex-col md:flex-row justify-between mt-8 space-y-4 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-1/3">
            <label
              htmlFor="subject"
              className="block text-gray-700 font-medium mb-2"
            >
              Выберите субъект
            </label>
            {isLoadingSubjects ? (
              <div>Загрузка субъектов...</div>
            ) : (
              <select
                name="subject"
                id="subject"
                className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-full text-gray-700 font-medium mb-2"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                required
              >
                <option value={0}>Субъект</option>
                {subjectsList?.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.subject_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Выбор даты начала */}
          <div className="w-full md:w-1/3">
            <label
              htmlFor="startDate"
              className="block text-gray-700 font-medium mb-2"
            >
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

          {/* Выбор даты окончания */}
          <div className="w-full md:w-1/3">
            <label
              htmlFor="endDate"
              className="block text-gray-700 font-medium mb-2"
            >
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

        {/* Список объектов в виде чекбоксов */}
        <div className="mt-4">
          <label className="block text-gray-700 font-medium mb-2">
            Выберите объекты
          </label>
          {isLoadingObjects ? (
            <div>Загрузка объектов...</div>
          ) : objectsList && objectsList.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {objectsList.map((obj) => (
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
          ) : (
            <div>Нет доступных объектов.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Graphs;

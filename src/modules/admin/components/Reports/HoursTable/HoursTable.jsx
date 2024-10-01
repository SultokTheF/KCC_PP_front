import React, { useState, useEffect } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import Sidebar from '../../Sidebar/Sidebar';

const HoursTable = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [hoursByDate, setHoursByDate] = useState({});
  const [providersList, setProvidersList] = useState([]);
  const [selectedProviderSubjects, setSelectedProviderSubjects] = useState([]);
  const [providerError, setProviderError] = useState('');
  const [datesByDayId, setDatesByDayId] = useState({});
  const [subjectsById, setSubjectsById] = useState({});

  const [formData, setFormData] = useState({
    object: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    subject: 0,
    startHour: 1,
    endHour: 24,
  });

  // Fetch subjects list
  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setSubjectsList(subjectsResponse.data);
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  // Function to fetch the date using the dayId and format it
  const fetchDateByDayId = async (dayId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axiosInstance.get(`${endpoints.DAYS}${dayId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const fullDate = response.data.date;

      const subjsctResponse = await axiosInstance.get(`${endpoints.SUBJECTS}${response.data.subject}`);

      const subject = subjsctResponse.data.subject_name;
      // Remove everything after 'T' and format the date as ДД.ММ.ГГГГ
      const formattedDate = fullDate.split('T')[0].split('-').reverse().join('.');
      setDatesByDayId((prev) => ({ ...prev, [dayId]: formattedDate }));
      setSubjectsById((prev) => ({ ...prev, [dayId]: subject }));
    } catch (error) {
      console.error('Ошибка при получении даты по dayId:', error);
      setDatesByDayId((prev) => ({ ...prev, [dayId]: 'Неизвестная дата' })); // Fallback in case of error
    }
  };

  // Fetch hours based on date and subject
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
        setHoursByDate({});
        return;
      }

      // Group hours by day
      const groupedHours = response.data.reduce((acc, hour) => {
        const day = hour.day;

        if (!acc[day]) {
          acc[day] = [];
        }

        acc[day].push(hour);

        return acc;
      }, {});

      // Sort the days and sort hours within each day by hour
      const sortedGroupedHours = Object.keys(groupedHours)
        .sort((a, b) => parseInt(a) - parseInt(b)) // Sort days numerically
        .reduce((acc, day) => {
          acc[day] = groupedHours[day].sort((a, b) => a.hour - b.hour); // Sort hours within the day
          return acc;
        }, {});

      setHoursByDate(sortedGroupedHours);

      // Fetch the date for each dayId and format it
      Object.keys(sortedGroupedHours).forEach((dayId) => fetchDateByDayId(dayId));
    } catch (error) {
      console.error('Ошибка при получении часов:', error);
      setHoursByDate({});
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.subject) {
      fetchHours(formData.startDate, formData.endDate, formData.subject);
    }
  }, [
    formData.startDate,
    formData.endDate,
    formData.subject,
    formData.startHour,
    formData.endHour,
  ]);

  const handleChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Таблица часов
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Selectors */}
            <div className="w-full">
              <label
                htmlFor="subject"
                className="block text-gray-700 font-semibold mb-2"
              >
                Выберите субъект
              </label>
              <select
                name="subject"
                id="subject"
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>
            <div className="w-full">
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
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>
            <div className="w-full">
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
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                required
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="startHour"
                className="block text-gray-700 font-semibold mb-2"
              >
                Час начала
              </label>
              <select
                name="startHour"
                id="startHour"
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.startHour}
                onChange={(e) => handleChange('startHour', parseInt(e.target.value))}
                required
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label
                htmlFor="endHour"
                className="block text-gray-700 font-semibold mb-2"
              >
                Час окончания
              </label>
              <select
                name="endHour"
                id="endHour"
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.endHour}
                onChange={(e) => handleChange('endHour', parseInt(e.target.value))}
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
        </div>

        {/* Table displaying hours by date */}
        {Object.keys(hoursByDate).map((dayId) => (
          <div key={dayId} className="mt-8">
            <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">
              Дата: {datesByDayId[dayId] || 'Загрузка...'}
            </h2>
            {/* Scrollable table container */}
            <div className="overflow-x-auto max-w-full bg-white shadow-md rounded-lg">
              <table className="table-fixed min-w-full text-sm bg-white border border-gray-200">
                <thead className="bg-gray-100 text-center">
                  <tr>
                    {[
                      'Час',
                      'Субъект',
                      'volume',
                      'P1',
                      'P2',
                      'P3',
                      'F1',
                      'F2',
                      'P1_Gen',
                      'P2_Gen',
                      'P3_Gen',
                      'F1_Gen',
                      'F2_Gen',
                      'EZ_T',
                      'EZ_Base_T',
                      'EZ_T_ВИЭ',
                      'EZ_T_РЭК',
                      'Pred_T',
                      'plan_T',
                      'Wo_Prov_T',
                      'W_Prov_T',
                      'BE_T',
                      'OD_T',
                      'T_Coef',
                      'direction',
                      'message',
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-2 py-1 border-b border-gray-200 font-medium text-gray-700"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hoursByDate[dayId].map((hour) => (
                    <tr key={hour.id} className="even:bg-gray-50 text-center">
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.hour}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {subjectsById[dayId] || 'Загрузка...'}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.volume}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.P1}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.P2}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.P3}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.F1}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.F2}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.P1_Gen}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.P2_Gen}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.P3_Gen}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.F1_Gen}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.F2_Gen}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.EZ_T}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.EZ_Base_T}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.EZ_T_ВИЭ}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.EZ_T_РЭК}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.Pred_T}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.plan_t}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.Wo_Prov_T}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.W_Prov_T}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.BE_T}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.OD_T}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.T_Coef}
                      </td>
                      <td
                        className={`px-2 py-1 border-b border-gray-200 ${hour.direction === 'DOWN'
                            ? 'bg-green-100'
                            : hour.direction === 'UP'
                              ? 'bg-red-100'
                              : ''
                          }`}
                      >
                        {hour.direction === 'UP'
                          ? '↑'
                          : hour.direction === 'DOWN'
                            ? '↓'
                            : '-'}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoursTable;

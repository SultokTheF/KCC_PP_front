import React, { useState, useEffect } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import Sidebar from '../../Sidebar/Sidebar';

const HoursTable = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [hoursByDate, setHoursByDate] = useState({});
  const [providersList, setProvidersList] = useState([]);
  const [selectedProviderSubjects, setSelectedProviderSubjects] = useState([]);
  const [providerError, setProviderError] = useState('');

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

      const groupedHours = {};
      let currentDay = new Date(startDate);
      let currentDayString = currentDay.toISOString().split('T')[0];
      let hourCounter = 0;

      response.data.forEach((hour) => {
        if (hourCounter === 24) {
          currentDay.setDate(currentDay.getDate() + 1);
          currentDayString = currentDay.toISOString().split('T')[0];
          hourCounter = 0;
        }

        // Compute hour in day
        const hourInDay = (hourCounter % 24) + 1;

        // Determine if the hour should be included
        let includeHour = true;
        if (startDate === endDate) {
          // Single day selection
          includeHour = hourInDay >= formData.startHour && hourInDay <= formData.endHour;
        } else {
          if (currentDayString === startDate) {
            // First day
            includeHour = hourInDay >= formData.startHour;
          } else if (currentDayString === endDate) {
            // Last day
            includeHour = hourInDay <= formData.endHour;
          } else {
            // Intermediate days
            includeHour = true;
          }
        }

        if (includeHour) {
          if (!groupedHours[currentDayString]) {
            groupedHours[currentDayString] = [];
          }
          // Adjust the hour.hour to be hourInDay
          groupedHours[currentDayString].push({ ...hour, hour: hourInDay });
        }

        hourCounter++;
      });

      setHoursByDate(groupedHours);
    } catch (error) {
      console.error('Ошибка при получении часов:', error);
      setHoursByDate({});
    }
  };

  // Fetch providers with error handling
  const fetchProviders = async (startDate, endDate) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axiosInstance.get(endpoints.PROVIDERS, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          sub: 1, // Adjust as necessary
          start_date: startDate.slice(0, 7), // format yyyy-mm
          end_date: endDate.slice(0, 7),
        },
      });

      if (response.data.error) {
        setProviderError(response.data.error);
        setProvidersList([]);
      } else if (response.data.length === 0) {
        setProviderError('No providers found with the provided criteria.');
        setProvidersList([]);
      } else {
        setProvidersList(response.data);
        setProviderError('');
      }
    } catch (error) {
      console.error('Ошибка при получении провайдеров:', error);
      setProviderError('Ошибка при получении провайдеров. Попробуйте позже.');
    }
  };

  // Fetch subjects belonging to a provider using provider_id
  const fetchProviderSubjects = async (providerId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axiosInstance.get(endpoints.SUBJECTS, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          provider_id: providerId,
        },
      });
      if (response.data && response.data.length > 0) {
        setSelectedProviderSubjects(response.data);
      } else {
        setSelectedProviderSubjects([]);
        console.error('No subjects found for the selected provider.');
      }
    } catch (error) {
      console.error('Ошибка при получении субъектов для провайдера:', error);
      setSelectedProviderSubjects([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.subject) {
      fetchHours(formData.startDate, formData.endDate, formData.subject);
      fetchProviders(formData.startDate, formData.endDate);
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

  const handleProviderClick = (providerId) => {
    fetchProviderSubjects(providerId);
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

        {/* Providers Section */}
        {/* ... existing code for providers ... */}

        {/* Selected Provider Subjects */}
        {/* ... existing code for selected provider subjects ... */}

        {/* Table displaying hours by date */}
        {Object.keys(hoursByDate).map((dayDate) => (
          <div key={dayDate} className="mt-8">
            <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">
              Дата: {dayDate.split('-').reverse().join('.')}
            </h2>
            {/* Scrollable table container */}
            <div className="overflow-x-auto max-w-full bg-white shadow-md rounded-lg">
              <table className="table-fixed min-w-full text-sm bg-white border border-gray-200">
                <thead className="bg-gray-100 text-center">
                  <tr>
                    {[
                      'Час',
                      'coefficient',
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
                  {hoursByDate[dayDate].map((hour) => (
                    <tr key={hour.id} className="even:bg-gray-50 text-center">
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.hour}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">
                        {hour.coefficient}
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
                        className={`px-2 py-1 border-b border-gray-200 ${
                          hour.direction === 'DOWN'
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

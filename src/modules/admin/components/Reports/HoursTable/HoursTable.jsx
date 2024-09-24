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

  // Fetch hours based on date, subject, and hours
  const fetchHours = async (startDate, endDate, subject, startHour, endHour) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axiosInstance.get(endpoints.HOURS, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate,
          end_date: endDate,
          sub: subject,
          start_hour: startHour,
          end_hour: endHour,
        },
      });

      if (!response.data || response.data.error || response.data.length === 0) {
        console.error('Ошибка при получении часов:', response.data.error || 'Часы не найдены с указанными критериями.');
        setHoursByDate({});
        return;
      }

      // Group hours by date
      const groupedHours = {};
      response.data.forEach((hour) => {
        // Assuming the API returns a 'date' field in 'YYYY-MM-DD' format
        const dayDate = hour.date || startDate; // Fallback to startDate if 'date' field is not present
        if (!groupedHours[dayDate]) {
          groupedHours[dayDate] = [];
        }
        groupedHours[dayDate].push(hour);
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
          sub: 1,
          start_date: startDate.slice(0, 7),
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
      fetchHours(formData.startDate, formData.endDate, formData.subject, formData.startHour, formData.endHour);
      fetchProviders(formData.startDate, formData.endDate);
    }
  }, [formData.startDate, formData.endDate, formData.subject, formData.startHour, formData.endHour]);

  const handleChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleProviderClick = (providerId) => {
    fetchProviderSubjects(providerId);
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Таблица часов</h1>
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Selectors */}
            <div className="w-full">
              <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
                Выберите субъект
              </label>
              <select
                name="subject"
                id="subject"
                className="w-full h-12 border border-gray-300 rounded-lg px-4"
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
            <div className="w-full">
              <label htmlFor="startDate" className="block text-gray-700 font-medium mb-2">
                Дата начала
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                className="w-full h-12 border border-gray-300 rounded-lg px-4"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>
            <div className="w-full">
              <label htmlFor="endDate" className="block text-gray-700 font-medium mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                className="w-full h-12 border border-gray-300 rounded-lg px-4"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                required
              />
            </div>
            <div className="w-full">
              <label htmlFor="startHour" className="block text-gray-700 font-medium mb-2">
                Час начала
              </label>
              <select
                name="startHour"
                id="startHour"
                className="w-full h-12 border border-gray-300 rounded-lg px-4"
                value={formData.startHour}
                onChange={(e) => handleChange('startHour', e.target.value)}
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
              <label htmlFor="endHour" className="block text-gray-700 font-medium mb-2">
                Час окончания
              </label>
              <select
                name="endHour"
                id="endHour"
                className="w-full h-12 border border-gray-300 rounded-lg px-4"
                value={formData.endHour}
                onChange={(e) => handleChange('endHour', e.target.value)}
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
        {Object.keys(hoursByDate).map(dayDate => (
          <div key={dayDate} className="mt-8">
            <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">
              Дата: {dayDate.split('-').reverse().join('.')}
            </h2>
            {/* Scrollable table container */}
            <div className="overflow-x-auto max-w-[1550px] bg-white shadow-md rounded-lg">
              <table className="table-fixed min-w-full text-sm bg-white border border-gray-200">
                <thead className="bg-gray-100 text-center">
                  {/* ... existing table headers ... */}
                </thead>
                <tbody>
                  {hoursByDate[dayDate].map(hour => (
                    <tr key={hour.id} className="even:bg-gray-50 text-center">
                      <td className="px-2 py-1 border-b border-gray-200">{hour.hour}</td>
                      {/* ... existing table cells ... */}
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

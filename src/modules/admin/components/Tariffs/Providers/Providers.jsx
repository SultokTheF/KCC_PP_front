import React, { useEffect, useState } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import Sidebar from '../../Sidebar/Sidebar';
import Calendar from './Calendar/Calendar';
import ProvidersTable from './ProvidersTable';

const Providers = () => {
  const [data, setData] = useState({
    subjects: [],
    providers: [],
    days: [],
    hours: [],
  });

  const [loading, setLoading] = useState({ superButton: false });

  const handleSuperButtonClick = async () => {
    setLoading(prev => ({ ...prev, superButton: true }));
    try {
      const accessToken = localStorage.getItem('accessToken');
      await axiosInstance.post(
        '/api/days/superButton/',
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      alert('Супер кнопка нажата!');
    } catch (error) {
      console.error('Ошибка при выполнении запроса супер кнопки:', error);
    } finally {
      setLoading(prev => ({ ...prev, superButton: false }));
    }
  };

  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const [selectedProviders, setSelectedProviders] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    try {
      const [subjectsResponse, providersResponse, hoursResponse, daysResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS),
        axiosInstance.get(endpoints.PROVIDERS),
        axiosInstance.get(endpoints.HOURS),
        axiosInstance.get(endpoints.DAYS),
      ]);

      setData({
        subjects: subjectsResponse.data,
        providers: providersResponse.data,
        hours: hoursResponse.data,
        days: daysResponse.data,
      });

      const initialSelectedProviders = {};
      subjectsResponse.data.forEach((subject) => {
        initialSelectedProviders[subject.id] = subject.providers;
      });
      setSelectedProviders(initialSelectedProviders);
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
      // Optionally, set an error state here
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      // Step 1: Construct the monthyear string in "YYYY-MM" format
      const { year, month } = selectedMonth;
      const formattedMonth = String(month + 1).padStart(2, '0');
      const monthyear = `${year}-${formattedMonth}`;

      // Step 2: Iterate over each subject and prepare the providers data
      for (const [subjectId, newProviders] of Object.entries(selectedProviders)) {
        // Transform the array of provider IDs into the required format
        const providersWithMonthYear = newProviders.map(providerId => ({
          id: providerId,
          monthyear: monthyear,
        }));

        try {
          // Step 3: Send the PATCH request with the transformed providers array
          await axiosInstance.patch(`${endpoints.SUBJECTS}${subjectId}/`, {
            providers: providersWithMonthYear,
          });
        } catch (error) {
          console.error(`Ошибка при обновлении провайдеров для subjectId ${subjectId}:`, error);
          // Optionally, handle individual subject update errors
        }
      }

      // Refresh the data after saving to ensure the UI is up-to-date
      await fetchData();

      // Display a success message to the user
      setSuccessMessage('Данные успешно сохранены!');
      // Clear the success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      // Optionally, handle global errors here
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Calendar
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          data={data}
          setData={setData}
        />
        <div className="p-2">
          <h1 className="text-2xl font-bold mb-4">Поставщики</h1>
          {successMessage && (
            <div className="bg-green-200 text-green-800 p-2 mb-4 rounded">{successMessage}</div>
          )}
          <ProvidersTable
            data={data}
            fetchData={fetchData}
            selectedProviders={selectedProviders}
            setSelectedProviders={setSelectedProviders}
            selectedMonth={selectedMonth}
          />
        </div>
        <div className="mt-4 flex justify-center">
          <button onClick={handleSave} className="bg-blue-500 text-white py-2 px-4 rounded">
            Сохранить
          </button>
          <button onClick={handleSuperButtonClick} className="bg-green-500 ml-5 text-white py-2 px-4 rounded">
            {loading.superButton ? (
              <span>Загрузка...</span>
            ) : (
              <>
                Супер Кнопка
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Providers;

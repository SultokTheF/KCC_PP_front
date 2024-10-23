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
  });

  const [loading, setLoading] = useState({ superButton: false });

  const handleSuperButtonClick = async () => {
    setLoading((prev) => ({ ...prev, superButton: true }));
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
      setLoading((prev) => ({ ...prev, superButton: false }));
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
      const [subjectsResponse, providersResponse, daysResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS),
        axiosInstance.get(endpoints.PROVIDERS),
        axiosInstance.get(endpoints.DAYS),
      ]);

      const subjectsData = subjectsResponse.data;
      const providersData = providersResponse.data;

      const monthyear = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;

      const initialSelectedProviders = {};
      subjectsData.forEach((subject) => {
        // Map provider IDs to provider objects
        const subjectProviders = subject.providers
          .map((providerId) => providersData.find((provider) => provider.id === providerId))
          .filter(Boolean); // Remove any undefined values

        // Find the provider assigned for the selected month
        const providerForMonth = subjectProviders.find((provider) => provider.month === monthyear);

        initialSelectedProviders[subject.id] = {
          providerId: providerForMonth ? providerForMonth.id : null,
          monthyear: monthyear,
        };
      });

      setSelectedProviders(initialSelectedProviders);

      setData({
        subjects: subjectsData,
        providers: providersData,
        days: daysResponse.data,
      });
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleSave = async () => {
    try {
      const updates = [];

      for (const subjectId in selectedProviders) {
        const providerAssignment = selectedProviders[subjectId];
        const providersArray = [];

        if (providerAssignment.providerId) {
          providersArray.push({
            id: providerAssignment.providerId,
            monthyear: providerAssignment.monthyear,
          });
        } else {
          // Unassigning provider for this subject and month
          providersArray.push({
            monthyear: providerAssignment.monthyear,
          });
        }

        updates.push({
          subject_id: parseInt(subjectId),
          providers: providersArray,
        });
      }

      // Send the updates array to the new endpoint
      await axiosInstance.post(endpoints.SUBJECTS_UPDATES, { updates });

      // Refresh the data after saving
      await fetchData();

      // Display a success message to the user
      setSuccessMessage('Данные успешно сохранены!');
      // Clear the success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
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
          <button
            onClick={handleSuperButtonClick}
            className="bg-green-500 ml-5 text-white py-2 px-4 rounded"
          >
            {loading.superButton ? <span>Загрузка...</span> : <>Супер Кнопка</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Providers;

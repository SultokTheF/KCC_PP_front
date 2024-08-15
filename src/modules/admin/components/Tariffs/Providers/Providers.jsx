import React, { useEffect, useState } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig'; // Ensure you have the correct path for axios instance
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
      subjectsResponse.data.forEach(subject => {
        initialSelectedProviders[subject.id] = subject.providers;
      });
      setSelectedProviders(initialSelectedProviders);

    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    const updatePromises = Object.entries(selectedProviders).map(async ([subjectId, newProviders]) => {
      try {
        await axiosInstance.patch(`${endpoints.SUBJECTS}${subjectId}/`, { providers: newProviders });
      } catch (error) {
        console.error(`Ошибка при обновлении провайдеров для subjectId ${subjectId}:`, error);
      }
    });
  
    try {
      await Promise.all(updatePromises);
      fetchData(); // Refresh the data after saving
      setSuccessMessage('Данные успешно сохранены!');
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
          {successMessage && <div className="bg-green-200 text-green-800 p-2 mb-4 rounded">{successMessage}</div>}
          <ProvidersTable
            data={data}
            fetchData={fetchData}
            selectedProviders={selectedProviders}
            setSelectedProviders={setSelectedProviders}
            selectedMonth={selectedMonth}
          />
        </div>
        <div className="mt-4 flex justify-center">
          <button onClick={handleSave} className="bg-blue-500 text-white py-2 px-4 rounded">Сохранить</button>
        </div>
      </div>
    </div>
  );
};

export default Providers;

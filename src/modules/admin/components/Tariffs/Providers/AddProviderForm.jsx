import React, { useState } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';

const AddProviderForm = ({ fetchData, selectedMonth, subjects }) => {
  const [providerName, setProviderName] = useState('');

  const handleAddProvider = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(endpoints.PROVIDERS, 
        { 
          name: providerName,
          month: `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`,
        }
      );
      setProviderName('');
      fetchData(); // Refresh the data to include the new provider
    } catch (error) {
      console.error('Ошибка при добавлении поставщика:', error);
    }
  };

  return (
    <form onSubmit={handleAddProvider} className="flex items-center justify-center space-x-1">
      <select 
        name="provider" 
        id="provider"
        value={providerName}
        onChange={(e) => setProviderName(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1"
      >
        <option value="" disabled>Выберите поставщика</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={`${subject.subject_name}_provider_${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`}>{subject.subject_name}</option>
        ))}
      </select>
      <button type="submit" className="bg-blue-500 text-white px-2 py-1 text-sm rounded">Добавить</button>
    </form>
  );
};

export default AddProviderForm;

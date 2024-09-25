import React, { useState } from 'react';
import AddProviderForm from './AddProviderForm';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';

const ProvidersTable = ({
  data,
  fetchData,
  selectedProviders,
  setSelectedProviders,
  selectedMonth,
}) => {
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [editingProviderName, setEditingProviderName] = useState('');

  const FormatType = ({ type }) => {
    if (type === 'CONSUMER') return 'Потребитель';
    if (type === 'ЭПО') return 'Станция';
    return type;
  };

  const handleCheckboxChange = (subjectId, providerId) => {
    setSelectedProviders((prevState) => {
      const isSelected = prevState[subjectId]?.includes(providerId);
      let newProviders = [];

      if (isSelected) {
        // If the provider is already selected, remove it
        newProviders = prevState[subjectId].filter((id) => id !== providerId);
      } else {
        // Replace with an array containing only the selected provider
        newProviders = [providerId];
      }

      return {
        ...prevState,
        [subjectId]: newProviders,
      };
    });
  };

  const day = data.days.filter((day) => {
    const dayDate = new Date(day.date);
    return (
      dayDate.getFullYear() === selectedMonth.year &&
      dayDate.getMonth() === selectedMonth.month &&
      dayDate.getDate() === 1
    );
  });

  const findHour = (subject, days, hours) => {
    const day = days.find((d) => d.subject === subject);
    const hour = hours.filter((h) => h.day === day?.id);
    return hour[0];
  };

  const handleDeleteProvider = async (providerId) => {
    try {
      await axiosInstance.delete(`${endpoints.PROVIDERS}${providerId}/`);
      fetchData(); // Refresh the data after deletion
    } catch (error) {
      console.error('Ошибка при удалении поставщика:', error);
    }
  };

  const handleEditProvider = (providerId, currentName) => {
    setEditingProviderId(providerId);
    setEditingProviderName(currentName);
  };

  const handleUpdateProvider = async (providerId) => {
    try {
      await axiosInstance.put(`${endpoints.PROVIDERS}${providerId}/`, { name: editingProviderName });
      fetchData(); // Refresh data after updating
      setEditingProviderId(null);
      setEditingProviderName('');
    } catch (error) {
      console.error('Ошибка при обновлении поставщика:', error);
    }
  };

  return (
    <div className="overflow-x-auto flex justify-center">
      <table className="min-w-full bg-white border border-gray-200 text-sm text-center">
        <thead>
          <tr>
            <th className="py-1 px-2 border-b">#</th>
            <th className="py-1 px-2 border-b">subject</th>
            <th className="py-1 px-2 border-b">type</th>
            <th className="py-1 px-2 border-b">prov_tariff</th>
            <th className="py-1 px-2 border-b">providers</th>
            {data.providers
              .filter((provider) => {
                const providerDate = provider.month;
                return (
                  `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}` ===
                  providerDate
                );
              })
              .map((provider) => (
                <th key={provider.id} className="py-1 px-2 border-b">
                  {editingProviderId === provider.id ? (
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={editingProviderName}
                        onChange={(e) => setEditingProviderName(e.target.value)}
                        className="border border-gray-300 rounded px-1 py-1"
                      />
                      <button
                        onClick={() => handleUpdateProvider(provider.id)}
                        className="ml-2 text-blue-500"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditingProviderId(null)}
                        className="ml-1 text-red-500"
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {provider.name}
                      <button
                        onClick={() => handleEditProvider(provider.id, provider.name)}
                        className="ml-2 text-blue-500"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="ml-1 text-red-500"
                      >
                        Удалить
                      </button>
                    </div>
                  )}
                </th>
              ))}
            <th className="py-1 px-2 border-b">
              <div className="flex justify-center items-center">
                <AddProviderForm
                  fetchData={fetchData}
                  selectedMonth={selectedMonth}
                  subjects={data.subjects}
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.subjects.map((subject, index) => (
            <tr key={subject.id}>
              <td className="py-1 px-2 border-b">{index + 1}</td>
              <td className="py-1 px-2 border-b">{subject.subject_name}</td>
              <td className="py-1 px-2 border-b">
                <FormatType type={subject.subject_type} />
              </td>
              <td className="py-1 px-2 border-b">
                {findHour(subject.id, day, data.hours)?.Prov_T
                  ? findHour(subject.id, day, data.hours)?.Prov_T
                  : '-'}
              </td>
              <td className="py-1 px-2 border-b">
                {selectedProviders[subject.id]
                  ?.map((providerId) => {
                    const provider = data.providers.find((provider) => {
                      return provider.id === providerId;
                    });
                    const providerDate = provider?.month;
                    const isCurrentMonth =
                      `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}` ===
                      providerDate;
                    return provider && isCurrentMonth ? provider.name : null;
                  })
                  .filter((name) => name)
                  .join(', ') || '-'}
              </td>
              {data.providers
                .filter((provider) => {
                  const providerDate = provider.month;
                  return (
                    `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}` ===
                    providerDate
                  );
                })
                .map((provider) => (
                  <td key={provider.id} className="py-1 px-2 border-b">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={selectedProviders[subject.id]?.includes(provider.id) || false}
                      onChange={() => handleCheckboxChange(subject.id, provider.id)}
                    />
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProvidersTable;

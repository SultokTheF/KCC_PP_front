import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../../../../services/apiConfig";

import Sidebar from "../../Sidebar/Sidebar";

const History = () => {
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    modelName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const historyResponse = await axiosInstance.get('/api/history/', { headers: { Authorization: `Bearer ${accessToken}` } });
      setHistory(historyResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const filterHistory = (history) => {
    return history.filter(item => {
      const actionMatch = filters.action ? item.action === filters.action : true;
      const modelNameMatch = filters.modelName ? item.model_name === filters.modelName : true;
      const startDateMatch = filters.startDate ? new Date(item.date) >= new Date(filters.startDate) : true;
      const endDateMatch = filters.endDate ? new Date(item.date) <= new Date(filters.endDate) : true;

      return actionMatch && modelNameMatch && startDateMatch && endDateMatch;
    });
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="container mx-auto p-4">
        <div className="mb-4 p-4 bg-white rounded shadow-md flex justify-between items-center">
          <div className="flex space-x-4">
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Все действия</option>
              <option value="create">Создание</option>
              <option value="update">Редактирование</option>
              <option value="delete">Удаление</option>
            </select>

            <select
              name="modelName"
              value={filters.modelName}
              onChange={handleFilterChange}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Все сущности</option>
              <option value="Subject">Субъекты</option>
              <option value="Object">Объекты</option>
              <option value="Day">Day</option>
              <option value="Hour">Hour</option>
            </select>
          </div>

          <div className="flex space-x-4">
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="h-[calc(100vh-9rem)] overflow-y-auto">
          <table className="table-auto w-full bg-white rounded shadow-md">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Операция</th>
                <th className="px-4 py-2 border">Сущность</th>
                <th className="px-4 py-2 border">Сообщение</th>
                <th className="px-4 py-2 border">Дата</th>
                <th className="px-4 py-2 border">Время</th>
              </tr>
            </thead>
            <tbody>
              {filterHistory(history).map((history, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border px-4 py-2">{history.action}</td>
                  <td className="border px-4 py-2">{history.model_name}</td>
                  <td className="border px-4 py-2">{history.message}</td>
                  <td className="border px-4 py-2">{history.date}</td>
                  <td className="border px-4 py-2">{formatTime(history.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;

import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../../../../services/apiConfig";
import Sidebar from "../../Sidebar/Sidebar";

const History = () => {
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    modelName: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const params = {};

      if (filters.action) params.action = filters.action;
      if (filters.modelName) params.model_name = filters.modelName;
      if (filters.date) params.date = filters.date;

      const historyResponse = await axiosInstance.get('/api/history/', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: params,
      });
      setHistory(historyResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const formatDateTime = (timestamp) => {
    const dateObj = new Date(timestamp);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time };
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
              <option value="Day">День</option>
              <option value="Hour">Час</option>
            </select>
          </div>

          <div className="flex space-x-4">
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="h-[calc(100vh-9rem)] overflow-y-auto">
          <table className="table-auto w-full bg-white rounded shadow-md">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Пользователь</th>
                <th className="px-4 py-2 border">Операция</th>
                <th className="px-4 py-2 border">Сущность</th>
                <th className="px-4 py-2 border">Сообщение</th>
                <th className="px-4 py-2 border">Дата</th>
                <th className="px-4 py-2 border">Время</th>
              </tr>
            </thead>
            <tbody>
              {history.map((historyItem, index) => {
                const { date, time } = formatDateTime(historyItem.timestamp);
                return (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border px-4 py-2">{historyItem?.user}</td>
                    <td className="border px-4 py-2">{historyItem?.action}</td>
                    <td className="border px-4 py-2">{historyItem?.model_name}</td>
                    <td className="border px-4 py-2">{historyItem?.message}</td>
                    <td className="border px-4 py-2">{date}</td>
                    <td className="border px-4 py-2">{time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;

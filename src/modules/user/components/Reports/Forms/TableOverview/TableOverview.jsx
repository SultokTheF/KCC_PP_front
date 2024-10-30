// TableOverview.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { axiosInstance, endpoints } from "../../../../../../services/apiConfig";
import { FaPlusCircle, FaChevronDown, FaChevronUp, FaTrashAlt } from "react-icons/fa";
import Sidebar from "../../../Sidebar/Sidebar";
import { useAuth } from "../../../../../../hooks/useAuth"; // Import useAuth
import { Circles } from 'react-loader-spinner'; // Import loader

// Operations and Formulas mappings for display and JSON
const operationMappings = {
  sum: "Сумма",
  avg: "Среднее",
  min: "Минимум",
  max: "Максимум",
  other: "Другое",
  formula: "Формула"
};

const TableOverview = () => {
  const [tables, setTables] = useState([]);
  const [subjects, setSubjects] = useState([]); // To store the list of subjects
  const [expandedTables, setExpandedTables] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Loader state for fetching data
  const [error, setError] = useState(null); // Error state

  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user

  // Fetch all tables and subjects on component mount
  useEffect(() => {
    const fetchTablesAndSubjects = async () => {
      try {
        setIsLoading(true);
        // Fetch tables
        const tableResponse = await axiosInstance.get(endpoints.TABLES);
        const allTables = tableResponse.data;

        // Fetch subjects
        const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
        setSubjects(subjectsResponse.data);

        // Filter tables based on user permissions
        const userTables = allTables.filter(table => table.users.includes(user.id));
        setTables(userTables);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
        setError("Не удалось загрузить данные. Попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTablesAndSubjects();
  }, [user.id]);

  // Map subject id to subject name
  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.subject_name : "Неизвестный субъект";
  };

  // Handle table deletion
  const handleDeleteTable = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту таблицу?")) {
      return;
    }

    try {
      await axiosInstance.delete(`${endpoints.TABLES}${id}/`);
      setTables((prevTables) => prevTables.filter((table) => table.id !== id));
      // Remove from expandedTables if it's expanded
      setExpandedTables((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } catch (error) {
      console.error("Ошибка при удалении таблицы:", error);
      alert("Не удалось удалить таблицу. Попробуйте позже.");
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex-col items-center p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Все Таблицы</h1>

        {/* Modal for creating a new table */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
              <h2 className="text-xl font-semibold mb-4">Новая Таблица</h2>
              <input
                type="text"
                placeholder="Введите имя таблицы"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
              />
              <div className="flex justify-end space-x-4">
                <button
                  className="p-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loader and Error Messages */}
        {isLoading ? (
          <div className="flex justify-center mt-10">
            <Circles color="#00BFFF" height={80} width={80} />
          </div>
        ) : error ? (
          <p className="text-red-500 mt-4">{error}</p>
        ) : (
          /* Render all tables */
          <div className="w-full overflow-x-auto">
            {tables.length > 0 ? (
              <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-gray-700 font-semibold">Имя таблицы</th>
                    <th className="text-left px-6 py-4 text-gray-700 font-semibold">Период создания</th>
                    <th className="text-left px-6 py-4 text-gray-700 font-semibold">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => (
                    <React.Fragment key={table.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 border-b">{table.name}</td>
                        <td className="px-6 py-4 border-b">
                          {new Date(table.start_date).toLocaleDateString()} - {new Date(table.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 border-b">
                          <Link to={`/forms/table/${table.id}`} className="text-blue-500 hover:text-blue-700 mr-4">
                            Редактировать
                          </Link>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="text-red-500 hover:text-red-700 flex items-center"
                          >
                            <FaTrashAlt className="mr-1" />
                            <span>Удалить</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded table content */}
                      {expandedTables[table.id] && (
                        <tr className="bg-gray-100">
                          <td colSpan="4" className="px-6 py-4">
                            {expandedTables[table.id].isLoading ? (
                              <div className="flex justify-center">
                                <Circles color="#00BFFF" height={80} width={80} />
                              </div>
                            ) : expandedTables[table.id].error ? (
                              <p className="text-red-500">{expandedTables[table.id].error}</p>
                            ) : expandedTables[table.id].data.length === 0 ? (
                              <p className="text-gray-500">Эта таблица пуста.</p>
                            ) : (
                              <>
                                <h3 className="font-semibold text-gray-800 mb-2">
                                  Содержание таблицы: {table.name}
                                </h3>

                                <div className="overflow-x-auto">
                                  <table className="min-w-full bg-white shadow-md rounded-lg">
                                    <thead>
                                      <tr className="bg-gray-200">
                                        <th className="px-4 py-2 border-b">Субъект</th>
                                        {expandedTables[table.id].data[0]?.data.map(
                                          (col, colIndex) => (
                                            <th key={colIndex} className="px-4 py-2 border-b">
                                              {col.plan === "formula"
                                                ? `Формула (${col.operation})`
                                                : `${col.plan} (${operationMappings[col.operation] || col.operation})`}
                                            </th>
                                          )
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedTables[table.id].data.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                          <td className="border px-4 py-2">{getSubjectName(row.subject)}</td>
                                          {row.data.map((col, colIndex) => (
                                            <td key={colIndex} className="border px-4 py-2">{col.value}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-700 mt-4">Таблицы не найдены.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableOverview;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig"; // Adjust this path based on your project
import { FaPlusCircle, FaChevronDown, FaChevronUp, FaTrashAlt } from "react-icons/fa";
import Sidebar from "../../Sidebar/Sidebar";

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
  const navigate = useNavigate();

  // Fetch all tables and subjects on component mount
  useEffect(() => {
    const fetchTablesAndSubjects = async () => {
      try {
        // Fetch tables
        const tableResponse = await axiosInstance.get(endpoints.TABLES);
        setTables(tableResponse.data);

        // Fetch subjects
        const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
        setSubjects(subjectsResponse.data);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
      }
    };

    fetchTablesAndSubjects();
  }, []);

  // Map subject id to subject name
  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.subject_name : "Неизвестный субъект";
  };

  // Handle expanding/collapsing table content
  const toggleExpandTable = async (id) => {
    if (expandedTables[id]) {
      setExpandedTables((prev) => ({ ...prev, [id]: false })); // Collapse if already expanded
    } else {
      // Fetch the table content only if not expanded
      try {
        const response = await axiosInstance.get(`${endpoints.TABLES}${id}/`);
        setExpandedTables((prev) => ({ ...prev, [id]: response.data }));
      } catch (error) {
        console.error("Ошибка при получении содержимого таблицы:", error);
      }
    }
  };

  // Handle table creation
  const handleCreateTable = async () => {
    try {
      const response = await axiosInstance.post(endpoints.TABLES, {
        name: newTableName,
      });

      if (response.status === 201) {
        navigate(`/forms/table/${response.data.id}`);
      }
    } catch (error) {
      console.error("Ошибка при создании таблицы:", error);
    }
  };

  // Handle table deletion
  const handleDeleteTable = async (id) => {
    try {
      await axiosInstance.delete(`${endpoints.TABLES}${id}/`);
      setTables((prevTables) => prevTables.filter((table) => table.id !== id));
    } catch (error) {
      console.error("Ошибка при удалении таблицы:", error);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex-col items-center p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Все Таблицы</h1>

        {/* Button to open modal */}
        <button
          className="mb-6 p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
          onClick={() => setShowModal(true)}
        >
          <FaPlusCircle className="mr-2" />
          <span>Создать новую таблицу</span>
        </button>

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
                <button
                  className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  onClick={handleCreateTable}
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Render all tables */}
        <div className="w-full">
          {tables.length > 0 ? (
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-700 font-semibold">
                    Имя таблицы
                  </th>
                  <th className="text-left px-6 py-4 text-gray-700 font-semibold">
                    Дата создания
                  </th>
                  <th className="text-left px-6 py-4 text-gray-700 font-semibold">
                    Действия
                  </th>
                  <th className="text-left px-6 py-4 text-gray-700 font-semibold">
                    Содержание
                  </th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr
                    key={table.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 border-b">{table.name}</td>
                    <td className="px-6 py-4 border-b">
                      {new Date(table.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 border-b">
                      <Link
                        to={`/forms/table/${table.id}`}
                        className="text-blue-500 hover:text-blue-700 mr-4"
                      >
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
                    <td className="px-6 py-4 border-b">
                      <button
                        onClick={() => toggleExpandTable(table.id)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        {expandedTables[table.id] ? (
                          <>
                            <FaChevronUp className="mr-1" />
                            Скрыть
                          </>
                        ) : (
                          <>
                            <FaChevronDown className="mr-1" />
                            Показать
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Expanded table content */}
                {tables.map(
                  (table) =>
                    expandedTables[table.id] && (
                      <tr key={`content-${table.id}`} className="bg-gray-100">
                        <td colSpan="4" className="px-6 py-4">
                          <h3 className="font-semibold text-gray-800 mb-2">
                            Содержание таблицы: {table.name}
                          </h3>

                          {/* Handle case where table data is empty */}
                          {expandedTables[table.id].data === null ? (
                            <p className="text-gray-500">Эта таблица пуста.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white shadow-md rounded-lg">
                                <thead>
                                  <tr className="bg-gray-200">
                                    <th className="px-4 py-2 border-b">
                                      Субъект
                                    </th>
                                    {expandedTables[table.id].data[0]?.columns.map(
                                      (col, colIndex) => (
                                        <th
                                          key={colIndex}
                                          className="px-4 py-2 border-b"
                                        >
                                          {/* Conditional display for formulas */}
                                          {col.plan === "formula"
                                            ? `Формула (${col.operation})`
                                            : `${col.plan} (${operationMappings[col.operation] || col.operation})`}
                                        </th>
                                      )
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {expandedTables[table.id].data.map(
                                    (row, rowIndex) => (
                                      <tr key={rowIndex}>
                                        <td className="border px-4 py-2">
                                          {getSubjectName(row.subject)}
                                        </td>
                                        {row.columns.map((col, colIndex) => (
                                          <td
                                            key={colIndex}
                                            className="border px-4 py-2"
                                          >
                                            {col.value}
                                          </td>
                                        ))}
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-700 mt-4">Таблицы не найдены.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableOverview;

/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from "react";

const DependedObjectsTable = ({
  objects,
  relatedObjects,
  onAddDependent,
  onDeleteDependent,
  onSend,
}) => {
  const [adding, setAdding] = useState(false);
  const [newDependent, setNewDependent] = useState("");

  const handleSaveNewDependent = () => {
    if (newDependent) {
      onAddDependent(newDependent);
      setAdding(false);
      setNewDependent("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-4">
      {/* Add/Send section above the table */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Зависимые объекты</h2>
        <div className="flex items-center space-x-2">
          {adding ? (
            <div className="flex items-center space-x-2">
              <select
                value={newDependent}
                onChange={(e) => setNewDependent(e.target.value)}
                className="border border-gray-300 rounded p-1"
              >
                <option value="">Выберите объект</option>
                {objects.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.object_name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSaveNewDependent}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Сохранить
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setAdding(true)}
                className="px-3 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300 transition"
              >
                Добавить
              </button>
              <button
                onClick={() => {
                  onSend();
                  // Alert on successful sending is handled in onSend (or show one here)
                }}
                className="px-3 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300 transition"
              >
                Отправить
              </button>
            </>
          )}
        </div>
      </div>
      <table className="w-full table-fixed border-collapse rounded overflow-hidden shadow">
        <thead>
          <tr>
            <th className="px-4 py-2 bg-gray-300 border w-40">Объект</th>
            <th className="px-4 py-2 bg-gray-300 border w-40">Тип</th>
            <th className="px-4 py-2 bg-gray-300 border w-20">Действие</th>
          </tr>
        </thead>
        <tbody>
          {relatedObjects && relatedObjects.length > 0 ? (
            relatedObjects.map((obj) => (
              <tr key={obj.object_id} className="border-t">
                <td className="px-4 py-2 w-40">{obj.object_name}</td>
                <td className="px-4 py-2 w-40">{obj.object_type}</td>
                <td className="px-4 py-2 w-20">
                  <button
                    onClick={() => onDeleteDependent(obj.object_id)}
                    className="bg-red-500 hover:bg-red-700 text-white rounded-full p-1 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a1 1 0 011 1v2H9V4a1 1 0 011-1z"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="px-4 py-2 text-center text-gray-500">
                Нет зависимых объектов
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DependedObjectsTable;

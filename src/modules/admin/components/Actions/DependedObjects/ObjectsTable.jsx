/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

const ObjectsTable = ({
  objects,
  dependedObjects,
  selectedObject,
  setSelectedObject,
  selectedMonth,
  refreshDependedObjects,
}) => {
  const [adding, setAdding] = useState(false);
  const [newRoot, setNewRoot] = useState("");

  // Format month as "YYYY-MM"
  const formattedMonth = `${selectedMonth.year}-${String(
    selectedMonth.month + 1
  ).padStart(2, "0")}`;

  // Handler for saving a new root object dependency via POST
  const handleSaveNewRoot = async () => {
    if (newRoot) {
      try {
        const payload = {
          root_object: parseInt(newRoot, 10),
          month: formattedMonth,
        };
        const response = await axiosInstance.post(endpoints.DEPENDED_OBJECTS, payload);
        window.alert("Root object added successfully!");
        setAdding(false);
        setNewRoot("");
        refreshDependedObjects();
      } catch (error) {
        console.error("Error adding root object", error);
        window.alert("Error adding root object");
      }
    }
  };

  // Handler for deleting a root object dependency via DELETE
  const handleDelete = async (depObjId) => {
    try {
      await axiosInstance.delete(`${endpoints.DEPENDED_OBJECTS}${depObjId}/`);
      window.alert("Root object deleted successfully!");
      refreshDependedObjects();
    } catch (error) {
      console.error("Error deleting root object", error);
      window.alert("Error deleting root object");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold">Корневые объекты</h2>
      {/* Add button section for root objects */}
      <div className="flex justify-end mb-2">
        {adding ? (
          <div className="flex items-center space-x-2">
            <select
              value={newRoot}
              onChange={(e) => setNewRoot(e.target.value)}
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
              onClick={handleSaveNewRoot}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Сохранить
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300 transition"
          >
            Добавить
          </button>
        )}
      </div>
      <table className="w-full table-fixed border-collapse rounded overflow-hidden shadow">
        <thead>
          <tr>
            <th className="px-4 py-2 bg-gray-300 border w-40">
              Корневые объекты
            </th>
            {dependedObjects &&
              dependedObjects.map((depObj) => {
                const obj = objects.find(
                  (o) => String(o.id) === String(depObj.root_object)
                );
                return (
                  <th
                    key={depObj.id}
                    onClick={() => setSelectedObject(depObj.root_object)}
                    className={`px-4 py-2 border cursor-pointer select-none w-40 ${
                      String(selectedObject) === String(depObj.root_object)
                        ? "bg-blue-300 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{obj?.object_name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(depObj.id);
                        }}
                        className="ml-2 bg-red-500 hover:bg-red-800 text-white rounded-full p-1 transition"
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
                    </div>
                  </th>
                );
              })}
          </tr>
        </thead>
      </table>
    </div>
  );
};

export default ObjectsTable;

import React, { useState, useEffect } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import Sidebar from "../../Sidebar/Sidebar";
import FormulaEditor from "./FormulaEditor";

const FormulaConstructor = () => {
  const [formulaName, setFormulaName] = useState("");
  const [formulaExpression, setFormulaExpression] = useState("");
  const [formulaList, setFormulaList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFormulaId, setCurrentFormulaId] = useState(null);

  // Fetch the list of formula variables when the component mounts
  useEffect(() => {
    fetchFormulaVariables();
  }, []);

  const fetchFormulaVariables = async () => {
    try {
      const response = await axiosInstance.get(endpoints.FORMULA);
      setFormulaList(response.data);
    } catch (error) {
      console.error("Ошибка при получении формул", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulaName || !formulaExpression) {
      alert("Пожалуйста, заполните все поля.");
      return;
    }

    const payload = {
      name: formulaName,
      expression: formulaExpression,
    };

    try {
      if (isEditing && currentFormulaId) {
        // Update existing formula
        await axiosInstance.put(`${endpoints.FORMULA}${currentFormulaId}/`, payload);
        setIsEditing(false);
        setCurrentFormulaId(null);
      } else {
        // Create new formula
        await axiosInstance.post(endpoints.FORMULA, payload);
      }

      // Fetch updated list
      fetchFormulaVariables();

      // Clear the input fields
      setFormulaName("");
      setFormulaExpression("");
    } catch (error) {
      console.error("Ошибка при сохранении формулы", error);
    }
  };

  const handleEdit = (formula) => {
    setIsEditing(true);
    setCurrentFormulaId(formula.id);
    setFormulaName(formula.name);
    setFormulaExpression(formula.expression);
  };

  const handleDelete = async (formulaId) => {
    if (window.confirm("Вы уверены, что хотите удалить эту формулу?")) {
      try {
        await axiosInstance.delete(`${endpoints.FORMULA}${formulaId}/`);
        fetchFormulaVariables();
      } catch (error) {
        console.error("Ошибка при удалении формулы", error);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Конструктор формул
          </h1>
          <form onSubmit={handleSubmit} className="mb-10">
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Название переменной
              </label>
              <input
                type="text"
                value={formulaName}
                onChange={(e) => setFormulaName(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите название переменной"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Формула
              </label>
              <FormulaEditor
                value={formulaExpression}
                onChange={setFormulaExpression}
                existingFormulas={formulaList}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition duration-200 font-semibold"
            >
              {isEditing ? "Обновить формулу" : "Сохранить формулу"}
            </button>
          </form>

          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Сохраненные формулы
          </h2>
          {formulaList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formulaList.map((formula) => (
                <div
                  key={formula.id}
                  className="border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200 bg-white relative"
                >
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    {formula.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{formula.expression}</p>
                  <div className="absolute top-4 right-4 space-x-2">
                    <button
                      onClick={() => handleEdit(formula)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(formula.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Формулы еще не сохранены.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormulaConstructor;

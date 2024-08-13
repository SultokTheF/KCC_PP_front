import React, { useState } from "react";
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/solid";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

const AddHolidayForm = ({ selectedDate, holidays, fetchData }) => {
  const [holidayData, setHolidayData] = useState({
    name: "",
    country: "Kazakhstan",
    is_regular: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editHolidayData, setEditHolidayData] = useState({});

  const currentHolidays = holidays.filter((holiday) => holiday.date === selectedDate);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHolidayData({
      ...holidayData,
      [name]: value,
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditHolidayData({
      ...editHolidayData,
      [name]: value,
    });
  };

  const handleCheckboxChange = () => {
    setHolidayData({
      ...holidayData,
      is_regular: !holidayData.is_regular,
    });
  };

  const handleEditCheckboxChange = () => {
    setEditHolidayData({
      ...editHolidayData,
      is_regular: !editHolidayData.is_regular,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(
        endpoints.HOLIDAYS,
        { ...holidayData, date: selectedDate },
      );
      fetchData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`${endpoints.HOLIDAYS}${id}/`);
      // Fetch updated holidays list
      fetchData();
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  };

  const handleEdit = (holiday) => {
    setEditingId(holiday.id);
    setEditHolidayData(holiday);
  };

  const handleSaveEdit = async (id) => {
    try {
      await axiosInstance.put(
        `${endpoints.HOLIDAYS}${id}/`,
        editHolidayData
      );
      // Fetch updated holidays list
      fetchData();
      setEditingId(null);
    } catch (error) {
      console.error('Error editing holiday:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditHolidayData({});
  };

  return (
    <div className="p-4">
      <button onClick={() => setIsModalOpen(true)} className="p-2 my-5 bg-green-500 text-white rounded-lg flex items-center">
        <PlusIcon className="w-5 h-5 mr-2" />
        Добавить
      </button>
      {currentHolidays.length === 0 ? (
        <div>
          <p className="mb-4">На выбранную дату нет праздников. Вы можете добавить новый праздник.</p>
        </div>
      ) : (
        <div>
          <h3 className="mb-4">Праздники на выбранную дату:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentHolidays.map((holiday) => (
              <div key={holiday.id} className="mb-4 p-4 border rounded-lg flex flex-col">
                {editingId === holiday.id ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={editHolidayData.name}
                      onChange={handleEditInputChange}
                      className="mb-2 p-2 border rounded-lg"
                    />
                    <select
                      name="country"
                      value={editHolidayData.country}
                      onChange={handleEditInputChange}
                      className="mb-2 p-2 border rounded-lg"
                    >
                      <option value="Kazakhstan">РК</option>
                      <option value="Russia">РФ</option>
                      <option value="WEEKEND">Выходной</option>
                    </select>
                    <div className="flex justify-between">
                      <button onClick={() => handleSaveEdit(holiday.id)} className="p-2 bg-green-500 text-white rounded-lg flex items-center">
                        <CheckIcon className="w-5 h-5 mr-2" />
                        Сохранить
                      </button>
                      <button onClick={handleCancelEdit} className="p-2 bg-gray-500 text-white rounded-lg flex items-center">
                        <XMarkIcon className="w-5 h-5 mr-2" />
                        Отмена
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p><strong>Название:</strong> {holiday.name}</p>
                    <p><strong>Причина:</strong> {holiday.country}</p>
                    <div className="flex space-x-2 mt-auto">
                      <button onClick={() => handleEdit(holiday)} className="p-2 bg-blue-500 text-white rounded-lg flex items-center">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(holiday.id)} className="p-2 bg-red-500 text-white rounded-lg flex items-center">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="mb-4">Добавить новый праздник:</h3>
            <form onSubmit={handleSubmit} className="p-4 border rounded-lg">
              <div className="mb-4">
                <label className="block mb-2">Название:</label>
                <input
                  type="text"
                  name="name"
                  value={holidayData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Причина:</label>
                <select
                  name="country"
                  value={holidayData.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="Kazakhstan">РК</option>
                  <option value="Russia">РФ</option>
                  <option value="WEEKEND">Выходной</option>
                </select>
              </div>
              <div className="flex justify-between">
                <button type="submit" className="p-2 bg-green-500 text-white rounded-lg flex items-center">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Добавить
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-500 text-white rounded-lg flex items-center">
                  <XMarkIcon className="w-5 h-5 mr-2" />
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddHolidayForm;

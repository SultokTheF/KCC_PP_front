import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import { axiosInstance } from "../../../../services/apiConfig";

const SingleUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    subject_name: "",
    subject_bin: "",
    email: "",
    role: "USER", // Default role
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get(`user/users/${id}/`);
        setUserData(response.data);
        setFormData({
          subject_name: response.data.subject_name,
          subject_bin: response.data.subject_bin,
          email: response.data.email,
          role: response.data.role,
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await axiosInstance.put(`user/users/${id}/`, formData);
      setUserData(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update user data:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`user/users/${id}/`);
      navigate("/users"); // Redirect to the users list or another appropriate page after deletion
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-gray-100 flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Профиль {formData.subject_name}</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="w-1/4 font-medium">Имя:</div>
              {isEditing ? (
                <input
                  type="text"
                  name="subject_name"
                  value={formData.subject_name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              ) : (
                <div>{userData.subject_name}</div>
              )}
            </div>
            <div className="flex items-center mb-2">
              <div className="w-1/4 font-medium">БИН/ИИН:</div>
              {isEditing ? (
                <input
                  type="text"
                  name="subject_bin"
                  value={formData.subject_bin}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              ) : (
                <div>{userData.subject_bin}</div>
              )}
            </div>
            <div className="flex items-center mb-2">
              <div className="w-1/4 font-medium">Email:</div>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              ) : (
                <div>{userData.email}</div>
              )}
            </div>
            <div className="flex items-center mb-2">
              <div className="w-1/4 font-medium">Роль:</div>
              {isEditing ? (
                <select
                  name="role"
                  id="role"
                  className="h-10 border border-gray-300 rounded px-4 w-full focus:outline-none focus:border-blue-500"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="USER">Пользователь</option>
                  <option value="ADMIN">Администратор</option>
                  <option value="DISPATCHER">Диспетчер</option>
                </select>
              ) : (
                <div>{userData.role}</div>
              )}
            </div>
          </div>
          {userData?.role !== "ADMIN" && (
            isEditing ? (
              <>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 mr-2"
                  onClick={handleSubmit}
                >
                  Сохранить
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                  onClick={() => setIsEditing(false)}
                >
                  Отменить
                </button>
              </>
            ) : (
              <>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 mr-2"
                  onClick={() => setIsEditing(true)}
                >
                  Редактировать Профиль
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                  onClick={handleDelete}
                >
                  Удалить Профиль
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleUser;

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import Sidebar from "../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../services/apiConfig";

const Profile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    subject_name: "",
    subject_bin: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setUserData(user);
      setFormData({
        subject_name: user.subject_name,
        subject_bin: user.subject_bin,
        email: user.email,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await axiosInstance.put(`${endpoints.USERS}${user.id}/`, formData);
      // Assuming the response contains the updated user data
      setUserData(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update user profile:", error);
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-gray-100 flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Профиль</h1>
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
              <div>{userData.role}</div>
            </div>
          </div>
          {isEditing ? (
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 mr-2"
              onClick={handleSubmit}
            >
              Сохранить
            </button>
          ) : (
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 mr-2"
              onClick={() => setIsEditing(true)}
            >
              Редактировать Профиль
            </button>
          )}
          {isEditing && (
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
              onClick={() => setIsEditing(false)}
            >
              Отменить
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

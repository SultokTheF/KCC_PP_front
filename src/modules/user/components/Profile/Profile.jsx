import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import Sidebar from "../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../services/apiConfig";

const Profile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    subject_name: "",
    subject_bin: "",
    email: "",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    old_password: "",
    password: "",
    password2: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setUserData(user);
      setFormData({
        subject_name: user.subject_name || "",
        subject_bin: user.subject_bin || "",
        email: user.email || "",
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData({
      ...passwordFormData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.put(
        `${endpoints.USERS}${user.id}/`,
        formData
      );
      // Предполагается, что ответ содержит обновлённые данные пользователя
      setUserData(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Не удалось обновить профиль пользователя:", error);
      // Можно добавить отображение ошибки пользователю
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const { old_password, password, password2 } = passwordFormData;

    if (password !== password2) {
      setPasswordError("Новый пароль и подтверждение пароля не совпадают.");
      return;
    }

    try {
      const response = await axiosInstance.put(
        `${endpoints.CHANGE_PASSWORD(user.id)}`,
        {
          old_password: old_password,
          password: password,
          password2: password2,
        }
      );
      console.log("Пароль успешно изменён:", response.data);
      setPasswordSuccess("Пароль успешно изменён.");
      setPasswordFormData({
        old_password: "",
        password: "",
        password2: "",
      });
      setIsChangingPassword(false);
    } catch (error) {
      console.error("Не удалось изменить пароль:", error);
      setPasswordError(
        error.response?.data?.detail || "Не удалось изменить пароль."
      );
    }
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Профиль</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              {/* Имя */}
              <div className="flex items-center mb-4">
                <label className="w-1/4 font-medium">Имя:</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="subject_name"
                    value={formData.subject_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                ) : (
                  <div>{userData.subject_name}</div>
                )}
              </div>
              {/* БИН/ИИН */}
              <div className="flex items-center mb-4">
                <label className="w-1/4 font-medium">БИН/ИИН:</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="subject_bin"
                    value={formData.subject_bin}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                ) : (
                  <div>{userData.subject_bin}</div>
                )}
              </div>
              {/* Email */}
              <div className="flex items-center mb-4">
                <label className="w-1/4 font-medium">Email:</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                ) : (
                  <div>{userData.email}</div>
                )}
              </div>
              {/* Роль */}
              <div className="flex items-center mb-4">
                <label className="w-1/4 font-medium">Роль:</label>
                <div>{userData.role}</div>
              </div>
            </div>
            {/* Кнопки редактирования */}
            <div className="flex items-center">
              {isEditing ? (
                <>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 mr-2"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                    onClick={() => setIsEditing(false)}
                  >
                    Отменить
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 mr-2"
                  onClick={() => setIsEditing(true)}
                >
                  Редактировать Профиль
                </button>
              )}
              <button
                type="button"
                className={`${
                  isChangingPassword
                    ? "bg-gray-500 hover:bg-gray-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white px-4 py-2 rounded-md transition duration-300`}
                onClick={() => setIsChangingPassword(!isChangingPassword)}
              >
                {isChangingPassword ? "Закрыть" : "Сменить пароль"}
              </button>
            </div>
          </form>

          {/* Форма смены пароля */}
          {isChangingPassword && (
            <div className="mt-6">
              <h2 className="text-2xl font-semibold mb-4">Смена пароля</h2>
              <form onSubmit={handleChangePassword}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="old_password">
                    Текущий пароль:
                  </label>
                  <input
                    type="password"
                    id="old_password"
                    name="old_password"
                    value={passwordFormData.old_password}
                    onChange={handlePasswordChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="password">
                    Новый пароль:
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={passwordFormData.password}
                    onChange={handlePasswordChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="password2">
                    Подтвердите новый пароль:
                  </label>
                  <input
                    type="password"
                    id="password2"
                    name="password2"
                    value={passwordFormData.password2}
                    onChange={handlePasswordChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                {passwordError && (
                  <div className="mb-4 text-red-500">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="mb-4 text-green-500">{passwordSuccess}</div>
                )}
                <div className="flex items-center">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 mr-2"
                  >
                    Изменить пароль
                  </button>
                  <button
                    type="button"
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-300"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordFormData({
                        old_password: "",
                        password: "",
                        password2: "",
                      });
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                  >
                    Отменить
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

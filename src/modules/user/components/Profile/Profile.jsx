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
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Password requirements
  const passwordRequirements = [
    {
      label: "Пароль должен содержать не менее 8 символов.",
      test: (password) => password.length >= 8,
    },
    {
      label: "Пароль должен содержать хотя бы одну заглавную букву.",
      test: (password) => /[A-Z]/.test(password),
    },
    {
      label: "Пароль должен содержать хотя бы один специальный символ (например, !@#$%^&*).",
      test: (password) => /[!@#$%^&*]/.test(password),
    },
    {
      label: "Пароль не должен состоять только из цифр.",
      test: (password) => !/^\d+$/.test(password),
    },
  ];

  const [passwordValidity, setPasswordValidity] = useState(
    passwordRequirements.map(() => false)
  );

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

  const objectOptions = []; // Placeholder if needed

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

  // Update password validity based on current password input
  useEffect(() => {
    const validity = passwordRequirements.map((requirement) =>
      requirement.test(passwordFormData.password)
    );
    setPasswordValidity(validity);
  }, [passwordFormData.password]);

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
    setPasswordErrors([]);
    setPasswordSuccess("");

    const { old_password, password, password2 } = passwordFormData;

    if (password !== password2) {
      setPasswordErrors(["Новый пароль и подтверждение пароля не совпадают."]);
      return;
    }

    // Check if all password requirements are met before sending to server
    const unmetRequirements = passwordRequirements.filter(
      (req) => !req.test(password)
    ).map((req) => req.label);

    if (unmetRequirements.length > 0) {
      setPasswordErrors(unmetRequirements);
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
      if (error.response && error.response.data) {
        // Assuming error.response.data.password is an array of error messages
        if (error.response.data.password) {
          setPasswordErrors(error.response.data.password);
        } else if (error.response.data.detail) {
          setPasswordErrors([error.response.data.detail]);
        } else {
          setPasswordErrors(["Не удалось изменить пароль."]);
        }
      } else {
        setPasswordErrors(["Не удалось изменить пароль."]);
      }
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
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                ) : (
                  <div>{userData.email}</div>
                )}
              </div>
              {/* Роль */}
              <div className="flex items-center mb-4">
                <label className="w-1/4 font-medium">Роль:</label>
                <div>{userRoleMapping[userData.role] || userData.role}</div>
              </div>
            </div>
            {/* Кнопки редактирования */}
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form data to original user data
                      setFormData({
                        subject_name: userData.subject_name || "",
                        subject_bin: userData.subject_bin || "",
                        email: userData.email || "",
                      });
                    }}
                  >
                    Отменить
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
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
                  <label
                    className="block text-gray-700 mb-2"
                    htmlFor="old_password"
                  >
                    Текущий пароль:
                  </label>
                  <input
                    type="password"
                    id="old_password"
                    name="old_password"
                    value={passwordFormData.old_password}
                    onChange={handlePasswordChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 mb-2"
                    htmlFor="password"
                  >
                    Новый пароль:
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={passwordFormData.password}
                    onChange={handlePasswordChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  {/* Password Requirements */}
                  <ul className="mt-2 text-sm">
                    {passwordRequirements.map((req, index) => (
                      <li
                        key={index}
                        className={`flex items-center ${
                          passwordValidity[index]
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {passwordValidity[index] ? (
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          ) : (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 001 1h1a1 1 0 100-2h-1V7z"
                              clipRule="evenodd"
                            />
                          )}
                        </svg>
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 mb-2"
                    htmlFor="password2"
                  >
                    Подтвердите новый пароль:
                  </label>
                  <input
                    type="password"
                    id="password2"
                    name="password2"
                    value={passwordFormData.password2}
                    onChange={handlePasswordChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                {/* Display Password Errors */}
                {passwordErrors.length > 0 && (
                  <div className="mb-4">
                    <div className="text-red-600 font-medium mb-2">
                      Ошибки при смене пароля:
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Display Password Success */}
                {passwordSuccess && (
                  <div className="mb-4 text-green-600 font-medium">
                    {passwordSuccess}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className={`${
                      passwordErrors.length > 0
                        ? "bg-green-300 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white px-4 py-2 rounded-md transition duration-300`}
                    disabled={passwordErrors.length > 0}
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
                      setPasswordErrors([]);
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

// Mapping for user roles (same as in the History component)
const userRoleMapping = {
  ADMIN: "Администратор",
  USER: "Пользователь",
  DISPATCHER: "Диспетчер",
  // Add more roles if necessary
};

export default Profile;

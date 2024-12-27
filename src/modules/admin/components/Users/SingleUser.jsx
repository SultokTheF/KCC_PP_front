import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../services/apiConfig";

const SingleUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    subject_name: "",
    subject_bin: "",
    email: "",
    role: "USER", // Default role
  });
  const [passwordFormData, setPasswordFormData] = useState({
    new_password: "",
    new_password2: "",
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
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      requirement.test(passwordFormData.new_password)
    );
    setPasswordValidity(validity);
  }, [passwordFormData.new_password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.put(
        `user/users/${id}/`,
        formData
      );
      // Assuming the response contains updated user data
      setUserData(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update user data:", error);
      // Optionally, display error messages to the admin
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErrors([]);
    setPasswordSuccess("");

    const { new_password, new_password2 } = passwordFormData;

    if (new_password !== new_password2) {
      setPasswordErrors(["Новый пароль и подтверждение пароля не совпадают."]);
      return;
    }

    // Check if all password requirements are met before sending to server
    const unmetRequirements = passwordRequirements.filter(
      (req) => !req.test(new_password)
    ).map((req) => req.label);

    if (unmetRequirements.length > 0) {
      setPasswordErrors(unmetRequirements);
      return;
    }

    try {
      const response = await axiosInstance.post(
        endpoints.ADMIN_CHANGE_PASSWORD(id),
        {
          new_password: new_password,
          new_password2: new_password2,
        }
      );
      console.log("Пароль успешно изменён:", response.data);
      setPasswordSuccess("Пароль успешно изменён.");
      setPasswordFormData({
        new_password: "",
        new_password2: "",
      });
      setIsChangingPassword(false);
    } catch (error) {
      console.error("Failed to change password:", error);
      if (error.response && error.response.data) {
        // Assuming error.response.data.new_password is an array of error messages
        if (error.response.data.new_password) {
          setPasswordErrors(error.response.data.new_password);
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

  const handleReset = async () => {
    try {
      const response = await axiosInstance.post(`user/users/${id}/recover/`);
      if (response.status === 200) {
        alert("Пользователь успешно восстановлен");
        fetchUserData();
      }
    } catch (error) {
      console.error("Failed to recover user account:", error);
      // Optionally, display error messages to the admin
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`user/users/${id}/`);
      navigate("/users"); // Redirect to the users list or another appropriate page after deletion
    } catch (error) {
      console.error("Failed to delete user:", error);
      // Optionally, display error messages to the admin
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
        <h1 className="text-3xl font-bold mb-6">
          Профиль {formData.subject_name}
        </h1>
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
              {userData.last_login && (
                <div className="flex items-center mb-2">
                  <label className="w-1/4 font-medium">Последний вход:</label>
                  <div>
                    {new Date(userData.last_login).toLocaleString("ru-RU")}
                  </div>
                </div>
              )}
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
                        role: userData.role || "USER",
                      });
                    }}
                  >
                    Отменить
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                    onClick={() => setIsEditing(true)}
                  >
                    Редактировать Профиль
                  </button>
                  {!userData.account_locked && (
                    <button
                      type="button"
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition duration-300"
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                    >
                      {isChangingPassword ? "Закрыть" : "Сменить пароль"}
                    </button>
                  )}
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                    onClick={handleDelete}
                  >
                    Удалить Профиль
                  </button>
                </>
              )}
              {userData.account_locked && (
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300"
                  onClick={handleReset}
                >
                  Восстановить Профиль
                </button>
              )}
            </div>
          </form>

          {/* Форма смены пароля */}
          {isChangingPassword && !userData.account_locked && (
            <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Смена пароля</h2>
              <form onSubmit={handleChangePassword}>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 mb-2"
                    htmlFor="new_password"
                  >
                    Новый пароль:
                  </label>
                  <input
                    type="password"
                    id="new_password"
                    name="new_password"
                    value={passwordFormData.new_password}
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
                    htmlFor="new_password2"
                  >
                    Подтвердите новый пароль:
                  </label>
                  <input
                    type="password"
                    id="new_password2"
                    name="new_password2"
                    value={passwordFormData.new_password2}
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
                        new_password: "",
                        new_password2: "",
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

// Mapping for user roles (similar to History and Profile components)
const userRoleMapping = {
  ADMIN: "Администратор",
  USER: "Пользователь",
  DISPATCHER: "Диспетчер",
  // Add more roles if necessary
};

export default SingleUser;

import React, { useState } from 'react';
import { Button } from "@material-tailwind/react"; 

import { axiosInstance, endpoints } from '../../services/apiConfig';

const Registration = () => {
  const [formData, setFormData] = useState({
    email: '',
    subject_bin: '',
    subject_name: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });

  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const navbarHeight = 60;
  const marginTop = `${navbarHeight}px`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Пароли не совпадают.');
      return;
    }

    try {
      const response = await axiosInstance.post(endpoints.USERS, {
        email: formData.email,
        subject_bin: formData.subject_bin,
        subject_name: formData.subject_name,
        password: formData.password,
        role: formData.role,
        name: formData.fullName
      });

      console.log('API response:', response.data);
      // Optionally, you can handle the API response here

      // Redirect to /login page after successful registration
      window.location.href = '/login';
    } catch (error) {
      console.error('There was a problem with the API request:', error);
      // Optionally, you can handle errors here

      // Display error message
      setErrorMessage('Произошла ошибка при регистрации. Пожалуйста, попробуйте снова.');
    }
  };

  return (
    <div className="p-6 flex items-center justify-center">
      <div className="container max-w-screen-lg mx-auto" style={{ marginTop }}>
        <div className="bg-white rounded shadow-lg p-8 md:p-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Регистрация</h2>
          <form onSubmit={handleSubmit}>
            <div className="lg:flex mb-4">
              <div className="lg:w-1/2 lg:mr-2">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Электронная почта *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="h-10 border border-gray-300 rounded px-4 w-full focus:outline-none focus:border-blue-500"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="lg:w-1/2">
                <label htmlFor="subject_bin" className="block text-gray-700 font-medium mb-2">
                  БИН субъекта *
                </label>
                <input
                  type="text"
                  name="subject_bin"
                  id="subject_bin"
                  className="h-10 border border-gray-300 rounded px-4 w-full focus:outline-none focus:border-blue-500"
                  value={formData.subject_bin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="lg:flex mb-4">
              <div className="lg:w-1/2 lg:mr-2">
                <label htmlFor="subject_name" className="block text-gray-700 font-medium mb-2">
                  Название субъекта *
                </label>
                <input
                  type="text"
                  name="subject_name"
                  id="subject_name"
                  className="h-10 border border-gray-300 rounded px-4 w-full focus:outline-none focus:border-blue-500"
                  value={formData.subject_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="lg:flex mb-6">
              <div className="lg:w-1/2 lg:mr-2">
                <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                  Пароль
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  className="h-10 border border-gray-300 rounded px-4 w-full focus:outline-none focus:border-blue-500"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  min={6}
                />
              </div>
              <div className="lg:w-1/2">
                <label htmlFor="confirmpassword" className="block text-gray-700 font-medium mb-2">
                  Поддтвердите пароль
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  className="h-10 border border-gray-300 rounded px-4 w-full focus:outline-none focus:border-blue-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="lg:flex">
              <Button fullWidth type='submit' variant="gradient" size="sm" className="lg:w-1/8">
                <span>Зарегистрироваться</span>
              </Button>

              <span className="lg:ml-5 lg:mt-1 lg:w-7/8">Уже есть аккаунт? <a href="/login" className='text-blue-700'>Войдите</a></span>
              {errorMessage && <span className="lg:ml-5 lg:mt-1 lg:w-7/8 text-red-600">{errorMessage}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;

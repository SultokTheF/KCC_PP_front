import React, { useState } from 'react';
import {
  Button
} from "@material-tailwind/react";

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData);
  };



  const navbarHeight = 100;
  const marginTop = `${navbarHeight}px`;

  return (
    <div className="p-6 flex items-center justify-center" style={{ marginTop }}>
      <div className="container max-w-screen-lg mx-auto">
        <div className="bg-white rounded shadow-lg p-8 md:p-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Авторизация</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                Почта Субъекта
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
            <div>
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
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-blue-700 font-medium mb-2 mt-2">
                {/* Забыли пароль? */}
              </label>
            </div>
            <div className="lg:flex">
              <Button type='submit' fullWidth variant="gradient" size="sm" className="lg: w-1/8">
                <span>Войти</span>
              </Button>

              <span className="lg:ml-5 lg:mt-1 lg: w-7/8">Нет аккаунта? <a href="/registration" className='text-blue-700'>Создайте ее</a></span> 
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

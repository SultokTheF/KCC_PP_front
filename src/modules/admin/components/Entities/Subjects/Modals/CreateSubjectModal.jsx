import React, { useState, useEffect } from 'react';
import { Button } from "@material-tailwind/react";
import Modal from 'react-modal';
import { axiosInstance } from '../../../../../../services/apiConfig';

Modal.setAppElement('#root');

const CreateSubjectModal = ({ isOpen, closeModal, onSubmit }) => {
  const [formData, setFormData] = useState({
    subject_bin: '',
    subject_name: '',
    email: '',
    subject_type: '',
    users: [], // Add users field
  });

  const [errorMessage, setErrorMessage] = useState({});
  const [users, setUsers] = useState([]); // State to store users list

  useEffect(() => {
    // Fetch users from the API
    const fetchUsers = async () => {
      try {
        const [usersResponse] = await Promise.all([
          axiosInstance.get('user/users/'),
        ]);
        setUsers(usersResponse.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'users') {
        formData[key].forEach((user) => formDataToSend.append('users', user));
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await axiosInstance.post('api/subjects/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('API response:', response.data);
      onSubmit(); 
      closeModal();
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data);
      } else {
        console.error('There was a problem with the API request:', error);
        setErrorMessage({ general: 'Произошла ошибка при отправке данных. Пожалуйста, попробуйте снова.' });
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel="Subject Modal"
      className="flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl mx-auto">
        <div className="flex justify-end">
          <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Создать Субъект</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="subject_bin" className="block text-gray-700 font-medium text-center">БИН Субъекта *</label>
              <input
                type="text"
                name="subject_bin"
                id="subject_bin"
                className="mt-1 block w-full text-center h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 bg-gray-100 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                value={formData.subject_bin}
                onChange={handleChange}
                required
              />
              {errorMessage.subject_bin && (
                <span className="text-red-600 mt-2 block text-center">{errorMessage.subject_bin[0]}</span>
              )}
            </div>
            <div>
              <label htmlFor="subject_name" className="block text-gray-700 font-medium text-center">Название Субъекта *</label>
              <input
                type="text"
                name="subject_name"
                id="subject_name"
                className="mt-1 block w-full h-10 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 bg-gray-100 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                value={formData.subject_name}
                onChange={handleChange}
                required
              />
              {errorMessage.subject_name && (
                <span className="text-red-600 mt-2 block text-center">{errorMessage.subject_name[0]}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium text-center">Email *</label>
              <input
                type="email"
                name="email"
                id="email"
                className="mt-1 block h-10 w-full text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring bg-gray-100 focus:ring-blue-500 focus:ring-opacity-50"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errorMessage.email && (
                <span className="text-red-600 mt-2 block text-center">{errorMessage.email[0]}</span>
              )}
            </div>
            <div>
              <label htmlFor="subject_type" className="block text-gray-700 font-medium text-center">Тип Субъекта *</label>
              <select
                name="subject_type"
                id="subject_type"
                className="mt-1 h-10 block w-full text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring bg-gray-100 focus:ring-blue-500 focus:ring-opacity-50"
                value={formData.subject_type}
                onChange={handleChange}
                required
              >
                <option value="">Выберите тип</option>
                <option value="ЭПО">ЭПО</option>
                <option value="CONSUMER">ПОТРЕБИТЕЛЬ</option>
              </select>
              {errorMessage.subject_type && (
                <span className="text-red-600 mt-2 block text-center">{errorMessage.subject_type[0]}</span>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="users" className="block text-gray-700 font-medium text-center">Пользователи *</label>
            <select
              multiple
              name="users"
              value={formData.users}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  users: Array.from(e.target.selectedOptions, option => option.value)
                })
              }
              className="mt-1 block w-full text-center h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 bg-gray-100 focus:ring-opacity-50"
              required
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            {errorMessage.users && (
              <span className="text-red-600 mt-2 block text-center">{errorMessage.users[0]}</span>
            )}
          </div>
          <div className="text-right">
            <Button fullWidth type="submit" variant="gradient" size="sm">
              <span>Отправить</span>
            </Button>
            {errorMessage.general && (
              <span className="text-red-600 mt-2 block text-center">{errorMessage.general}</span>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateSubjectModal;

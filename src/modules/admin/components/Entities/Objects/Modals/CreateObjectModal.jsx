import React, { useState, useEffect } from 'react';
import { Button } from "@material-tailwind/react";
import Modal from 'react-modal';
import { axiosInstance } from '../../../../../../services/apiConfig';
Modal.setAppElement('#root');

const CreateObjectModal = ({ isOpen, closeModal, onSubmit }) => {
  const [formData, setFormData] = useState({
    object_eic_code: '',
    object_name: '',
    zone_name: 'SOUTH-NORTH',
    object_type: 'ЭПО',
    users: [],
    subject: 0,
    related_objects: [],
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [objects, setObjects] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/user/users/');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchSubjects = async () => {
      try {
        const response = await axiosInstance.get('/api/subjects/');
        setSubjects(response.data);
        setFormData((prevData) => ({
          ...prevData,
          subject: response.data.length > 0 ? response.data[0].id : 0,
        }));
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    const fetchObjects = async () => {
      try {
        const response = await axiosInstance.get('/api/objects/');
        setObjects(response.data);
      } catch (error) {
        console.error('Error fetching objects:', error);
      }
    };

    fetchUsers();
    fetchSubjects();
    fetchObjects();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUsersChange = (e) => {
    const selectedUsers = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prevData) => ({
      ...prevData,
      users: selectedUsers,
    }));
  };

  const handleObjectsChange = (e) => {
    const selectedObjects = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prevData) => ({
      ...prevData,
      related_objects: selectedObjects,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form Data:', formData); // Debug log
    try {
      const response = await axiosInstance.post('/api/objects/', formData);
      console.log('API response:', response.data);
      onSubmit(); // Call onSubmit to handle any post-submission logic
      closeModal();
    } catch (error) {
      onSubmit(); // Call onSubmit to handle any post-submission logic
      closeModal();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel="Object Modal"
      className="flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl mx-auto">
        <div className="flex justify-end">
          <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Создать Объект</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="object_eic_code" className="block text-gray-700 font-medium text-center">Код EIC объекта *</label>
              <input
                type="text"
                name="object_eic_code"
                id="object_eic_code"
                className="mt-1 block w-full text-center h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 bg-gray-100"
                value={formData.object_eic_code}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="object_name" className="block text-gray-700 font-medium text-center">Название объекта *</label>
              <input
                type="text"
                name="object_name"
                id="object_name"
                className="mt-1 block w-full h-10 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 bg-gray-100"
                value={formData.object_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="zone_name" className="block text-gray-700 font-medium text-center">Название зоны *</label>
              <select
                name="zone_name"
                id="zone_name"
                className="mt-1 h-10 block w-full text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 bg-gray-100"
                value={formData.zone_name}
                onChange={handleChange}
                required
              >
                <option value="SOUTH-NORTH">Север-Юг</option>
                <option value="WEST">Запад</option>
              </select>
            </div>
            <div>
              <label htmlFor="object_type" className="block text-gray-700 font-medium text-center">Тип объекта *</label>
              <select
                name="object_type"
                id="object_type"
                className="mt-1 h-10 block w-full text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 bg-gray-100"
                value={formData.object_type}
                onChange={handleChange}
                required
              >
                <option value="">Выберите тип</option>
                <option value="ЭПО">ЭПО</option>
                <option value="РЭК">РЭК</option>
                <option value="CONSUMER">ПОТРЕБИТЕЛЬ</option>
                <option value="ВИЭ">ВИЭ</option>
                <option value="ГП">ГП</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="users" className="block text-gray-700 font-medium text-center">Пользователи</label>
              <select
                name="users"
                id="users"
                className="mt-1 block w-full h-32 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 bg-gray-100"
                multiple
                value={formData.users}
                onChange={handleUsersChange}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.subject_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subject" className="block text-gray-700 font-medium text-center">Субъект *</label>
              <select
                name="subject"
                id="subject"
                className="mt-1 h-10 block w-full text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 bg-gray-100"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.subject_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="related_objects" className="block text-gray-700 font-medium text-center">Связанные объекты</label>
              <select
                name="related_objects"
                id="related_objects"
                className="mt-1 block w-full h-32 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 bg-gray-100"
                multiple
                value={formData.related_objects}
                onChange={handleObjectsChange}
              >
                {objects.map((object) => (
                  <option key={object.id} value={object.id}>{object.object_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-right">
            <Button fullWidth type="submit" variant="gradient" size="sm">
              <span>Отправить</span>
            </Button>
            {errorMessage && (
              <span className="text-red-600 mt-4 text-center">{errorMessage}</span>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateObjectModal;

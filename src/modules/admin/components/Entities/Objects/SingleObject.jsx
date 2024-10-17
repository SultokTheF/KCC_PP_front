import React, { useState, useEffect } from 'react';
import Sidebar from '../../Sidebar/Sidebar';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../../../../services/apiConfig';

const SingleObject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [objectData, setObjectData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [objects, setObjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    object_eic_code: '',
    object_name: '',
    zone_name: '',
    object_type: '',
    subject: '',
    users: [],
    related_objects: [],  // Initialize as an empty array
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          objectResponse,
          subjectsResponse,
          usersResponse,
          objectsResponse,
        ] = await Promise.all([
          axiosInstance.get(`api/objects/${id}/`),
          axiosInstance.get(`api/subjects/`),
          axiosInstance.get(`user/users/`),
          axiosInstance.get(`api/objects/`),
        ]);

        const objectData = objectResponse.data;
        const subjectsData = subjectsResponse.data;
        const usersData = usersResponse.data;
        const objectsData = objectsResponse.data;

        setObjectData(objectData);
        setSubjects(subjectsData);
        setUsers(usersData);
        setObjects(objectsData);

        setFormData({
          object_eic_code: objectData.object_eic_code,
          object_name: objectData.object_name,
          zone_name: objectData.zone_name,
          object_type: objectData.object_type,
          subject: objectData.subject,
          users: objectData.users,
          related_objects: objectData.related_objects || [],  // Ensure this is always an array
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
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
      await axiosInstance.put(`api/objects/${id}/`, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update object data:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`api/objects/${id}/`);
      navigate('/objects');
    } catch (error) {
      console.error('Failed to delete object:', error);
    }
  };

  const formatType = (type) => {
    if (type === 'ЭПО') {
      return 'ЭПО';
    } else if (type === 'CONSUMER') {
      return 'Потребитель';
    } else if (type === 'РЭК') {
      return 'РЭК';
    }

    return type;
  }

  const formatZone = (zone) => {
    if (zone === 'SOUTH-NORTH') {
      return 'Юг-Север';
    } else if (zone === 'WEST') {
      return 'Запад';
    }

    return "Неизвестная Зона";
  }

  if (!objectData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">Объект: {formData.object_name}</h1>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4">
              {/* Object Name */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Название объекта:</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="object_name"
                    value={formData.object_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div>{formData.object_name}</div>
                )}
              </div>

              {/* Object EIC Code */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Код EIC объекта:</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="object_eic_code"
                    value={formData.object_eic_code}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div>{formData.object_eic_code}</div>
                )}
              </div>

              {/* Subject */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Субъект:</div>
                {isEditing ? (
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>{subjects.find(subject => subject.id === formData.subject)?.subject_name}</div>
                )}
              </div>

              {/* Users */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Пользователи:</div>
                {isEditing ? (
                  <select
                    multiple
                    name="users"
                    value={formData.users}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        users: Array.from(e.target.selectedOptions, (option) => option.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    {formData.users.map((userId) => {
                      const user = users.find((user) => user.id === userId);
                      return user ? (
                        <span key={user.id}>{user.email}, </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Object Type */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Тип объекта:</div>
                {isEditing ? (
                  <select
                    name="object_type"
                    value={formData.object_type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Выберите тип</option>
                    <option value="ЭПО">ЭПО</option>
                    <option value="РЭК">РЭК</option>
                    <option value="CONSUMER">ПОТРЕБИТЕЛЬ</option>
                    <option value="ВИЭ" >ВИЭ</option>
                    <option value="ГП" >ГП</option>
                  </select>
                ) : (
                  <div>{formatType(formData.object_type)}</div>
                )}
              </div>

              {/* Zone Name */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Зона:</div>
                {isEditing ? (
                  <select
                    name="zone_name"
                    value={formData.zone_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="SOUTH-NORTH">South-North</option>
                    <option value="WEST">West</option>
                  </select>
                ) : (
                  <div>{formatZone(formData.zone_name)}</div>
                )}
              </div>

              {/* Related Objects */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Связанные объекты:</div>
                {isEditing ? (
                  <select
                    multiple
                    name="related_objects"
                    value={formData.related_objects}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        related_objects: Array.from(e.target.selectedOptions, (option) => option.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {objects.map((obj) => (
                      <option key={obj.id} value={obj.id}>
                        {obj.object_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    {formData.related_objects?.map((objId) => {  // Safe check for map
                      const obj = objects.find((obj) => obj.id === objId);
                      return obj ? (
                        <span key={obj.id}>{obj.object_name}, </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                {isEditing ? (
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
                    <a
                      href={`/subjects/plan/${id}`}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 mr-2"
                    >
                      Планы
                    </a>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 mr-2"
                      onClick={() => setIsEditing(true)}
                    >
                      Редактировать
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                      onClick={handleDelete}
                    >
                      Удалить
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SingleObject;

import React, { useState, useEffect } from "react";
import Sidebar from "../../Sidebar/Sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import { axiosInstance } from "../../../../../services/apiConfig";

const SingleSubject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subjectData, setSubjectData] = useState(null);
  const [users, setUsers] = useState([]);
  const [objects, setObjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [formData, setFormData] = useState({
    subject_bin: "",
    subject_name: "",
    subject_type: "",
    email: "",
    legal_entity: "",
    legal_address: "",
    name: "",
    field_of_work: "",
    specified_capacity: "",
    is_AMSOCA: false,
    repair_schedules: null,
    existing_electrical_power_supply_scheme: null,
    users: []
  });

  useEffect(() => {
    const fetchSubjectData = async () => {
      try {
        const [subjectResponse, usersResponse, objectsResponse] = await Promise.all([
          axiosInstance.get(`api/subjects/${id}/`),
          axiosInstance.get(`user/users/`),
          axiosInstance.get('api/objects/')
        ]);

        const subject = subjectResponse.data;
        const usersData = usersResponse.data;
        const objectsData = objectsResponse.data.filter(obj => obj.subject === subject.id);

        setSubjectData(subject);
        setUsers(usersData);
        setObjects(objectsData);
        setFormData({
          subject_bin: subject.subject_bin || "",
          subject_name: subject.subject_name || "",
          subject_type: subject.subject_type || "",
          email: subject.email || "",
          legal_entity: subject.legal_entity || "",
          legal_address: subject.legal_address || "",
          name: subject.name || "",
          field_of_work: subject.field_of_work || "",
          specified_capacity: subject.specified_capacity || "",
          is_AMSOCA: subject.is_AMSOCA || false,
          repair_schedules: null, // Reset file inputs
          existing_electrical_power_supply_scheme: null,
          users: subject.users ? subject.users.map(userId => parseInt(userId, 10)) : []
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchSubjectData();
  }, [id]);

  const formatType = (type) => {
    switch (type) {
      case 'ЭПО':
        return 'ЭПО';
      case 'CONSUMER':
        return 'Потребитель';
      case 'РЭК':
        return 'РЭК';
      case 'ВИЭ':
        return 'ВИЭ';
      case 'ГП':
        return 'ГП';
      default:
        return type;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleUsersChange = (e) => {
    const selectedUsers = Array.from(e.target.selectedOptions, option => parseInt(option.value, 10));
    setFormData({
      ...formData,
      users: selectedUsers,
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({
      ...formData,
      [name]: files[0],
    });
  };

  const handleSubmit = async () => {
    const data = new FormData();
    
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        if (key === 'users') {
          // Append each user ID as a separate field
          formData[key].forEach(userId => data.append('users', userId));
        } else if (typeof formData[key] === 'boolean') {
          data.append(key, formData[key] ? 'true' : 'false');
        } else {
          data.append(key, formData[key]);
        }
      }
    }

    try {
      const response = await axiosInstance.put(`api/subjects/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSubjectData(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update user data:", error);
      // Optionally, handle error feedback to the user here
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`api/subjects/${id}/`);
      navigate("/subjects");
    } catch (error) {
      console.error("Failed to delete user:", error);
      // Optionally, handle error feedback to the user here
    }
  };

  const toggleShowMore = () => {
    setShowMore(!showMore);
  };

  if (!subjectData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">Субъект: {formData.subject_name}</h1>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4">
              {/* Subject Name */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Название Субъекта:</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="subject_name"
                    value={formData.subject_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div>{subjectData?.subject_name}</div>
                )}
              </div>

              {/* Subject BIN */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">БИН Субъекта:</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="subject_bin"
                    value={formData.subject_bin}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div>{subjectData?.subject_bin}</div>
                )}
              </div>

              {/* Subject Type */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Тип Субъекта:</div>
                {isEditing ? (
                  <select
                    name="subject_type"
                    value={formData.subject_type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Выберите тип</option>
                    <option value="ЭПО">ЭПО</option>
                    <option value="РЭК">РЭК</option>
                    <option value="CONSUMER">ПОТРЕБИТЕЛЬ</option>
                    <option value="ВИЭ">ВИЭ</option>
                    <option value="ГП">ГП</option>
                  </select>
                ) : (
                  <div>{formatType(subjectData?.subject_type)}</div>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center mb-2">
                <div className="w-1/4 font-medium">Электронная почта:</div>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div>{subjectData?.email}</div>
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
                    onChange={handleUsersChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    {formData.users.map((userId, index) => {
                      const user = users.find(user => user.id === userId);
                      return user ? (
                        <span key={user.id}>
                          <Link to={`/users/${user.id}`} className="text-blue-500 underline">
                            {user.email}
                          </Link>
                          {index < formData.users.length - 1 && ", "}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Data */}
            {showMore && (
              <div className="mb-4">
                {/* Repair Schedules */}
                <div className="flex items-center mb-2">
                  <div className="w-1/4 font-medium">Графики ремонта:</div>
                  {isEditing ? (
                    <input
                      type="file"
                      name="repair_schedules"
                      onChange={handleFileChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    subjectData?.repair_schedules && (
                      <a href={subjectData.repair_schedules} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        Скачать
                      </a>
                    )
                  )}
                </div>

                {/* Existing Electrical Power Supply Scheme */}
                <div className="flex items-center mb-2">
                  <div className="w-1/4 font-medium">Схема существующего электроснабжения:</div>
                  {isEditing ? (
                    <input
                      type="file"
                      name="existing_electrical_power_supply_scheme"
                      onChange={handleFileChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    subjectData?.existing_electrical_power_supply_scheme && (
                      <a href={subjectData.existing_electrical_power_supply_scheme} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        Скачать
                      </a>
                    )
                  )}
                </div>

                {/* Legal Entity */}
                <div className="flex items-center mb-2">
                  <div className="w-1/4 font-medium">Юридическое лицо:</div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="legal_entity"
                      value={formData.legal_entity}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <div>{subjectData?.legal_entity}</div>
                  )}
                </div>

                {/* Legal Address */}
                <div className="flex items-center mb-2">
                  <div className="w-1/4 font-medium">Юридический адрес:</div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="legal_address"
                      value={formData.legal_address}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <div>{subjectData?.legal_address}</div>
                  )}
                </div>

                {/* Name */}
                <div className="flex items-center mb-2">
                  <div className="w-1/4 font-medium">Имя:</div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <div>{subjectData?.name}</div>
                  )}
                </div>

                {/* Field of Work */}
                <div className="flex items-center mb-2">
                  <div className="w-1/4 font-medium">Сфера деятельности:</div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="field_of_work"
                      value={formData.field_of_work}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <div>{subjectData?.field_of_work}</div>
                  )}
                </div>

                {/* Specified Capacity */}
                <div className="flex items-center mb-2">
                  <div className="w-1/4 font-medium">Заданная мощность:</div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="specified_capacity"
                      value={formData.specified_capacity}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <div>{subjectData?.specified_capacity}</div>
                  )}
                </div>

                {/* is_AMSOCA */}
                <div className="flex items-center mb-2">
                  <div className="w-1/4 font-medium">Является AMSOCA:</div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      name="is_AMSOCA"
                      checked={formData.is_AMSOCA}
                      onChange={handleChange}
                      className="w-5 h-5"
                    />
                  ) : (
                    <div>{subjectData?.is_AMSOCA ? "Да" : "Нет"}</div>
                  )}
                </div>
              </div>
            )}

            {/* Toggle Show More */}
            <button
              onClick={toggleShowMore}
              className="text-blue-500 underline mt-4"
            >
              {showMore ? "Скрыть дополнительные данные" : "Показать дополнительные данные"}
            </button>
              
            {/* Related Objects */}
            <h2 className="text-2xl font-bold mb-4">Связанные объекты</h2>
            <div className="flex flex-wrap justify-left">
              {objects.map((object) => (
                <div key={object.id} className="w-full sm:w-1/2 md:w-1/3 px-2">
                  <Link to={`/objects/${object.id}`}>
                    <div className="p-5 w-11/12 border border-gray-200 rounded-lg ml-5 mt-5 hover:shadow-md">
                      <h3 className="text-lg font-semibold">{object.object_name}</h3>
                      <p className="text-sm text-gray-500">{formatType(object.object_type)}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
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
                  <Link 
                    to={`/subjects/plan/${id}`}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 mr-2"
                  >
                    Планы
                  </Link>
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
    </>
  );
};

export default SingleSubject;

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
    is_AMSOCA: "",
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

        const subjectData = subjectResponse.data;
        const usersData = usersResponse.data;
        const objectsData = objectsResponse.data.filter(obj => obj.subject === subjectData.id);

        setSubjectData(subjectData);
        setUsers(usersData);
        setObjects(objectsData);
        setFormData({
          subject_bin: subjectData.subject_bin,
          subject_name: subjectData.subject_name,
          subject_type: subjectData.subject_type,
          email: subjectData.email,
          legal_entity: subjectData.legal_entity,
          legal_address: subjectData.legal_address,
          name: subjectData.name,
          field_of_work: subjectData.field_of_work,
          specified_capacity: subjectData.specified_capacity,
          is_AMSOCA: subjectData.is_AMSOCA,
          repair_schedules: subjectData.repair_schedules,
          existing_electrical_power_supply_scheme: subjectData.existing_electrical_power_supply_scheme,
          users: subjectData.users
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchSubjectData();
  }, [id]);

  const formatType = (type) => {
    if (type === 'ЭПО') {
      return 'ЭПО';
    } else if (type === 'CONSUMER') {
      return 'Потребитель';
    } 
    return type;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
      data.append(key, formData[key]);
    }

    try {
      const response = await axiosInstance.put(`api/subjects/${id}/`, {
        subject_bin: formData.subject_bin,
        subject_name: formData.subject_name,
        subject_type: formData.subject_type,
        email: formData.email,
        users: formData.users,
      });
      setSubjectData(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update user data:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`api/subjects/${id}/`);
      navigate("/subjects");
    } catch (error) {
      console.error("Failed to delete user:", error);
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
                    <option value="РЭК" disabled>РЭК</option>
                    <option value="CONSUMER">ПОТРЕБИТЕЛЬ</option>
                    <option value="ВИЭ">ВИЭ</option>
                    <option value="ГП">ГП</option>
                  </select>
                ) : (
                  <div>{formatType(subjectData?.subject_type)}</div>
                )}
              </div>

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
                        users: Array.from(e.target.selectedOptions, option => option.value)
                      })
                    }
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
                    {formData.users.map(userId => {
                      const user = users.find(user => user.id === userId);
                      return user ? (
                        <Link key={user.id} to={`/users/${user.id}`} className="text-blue-500 underline">
                          {user.subject_name}
                        </Link>
                      ) : '';
                    }).reduce((prev, curr) => [prev, ', ', curr])}
                  </div>
                )}
              </div>
            </div>

            {showMore && (
              <div className="mb-4">
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

                <div className="flex items-center mb-2">
                  <div className="w-1/4 font-medium">Является AMSOCA:</div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      name="is_AMSOCA"
                      checked={formData.is_AMSOCA}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_AMSOCA: e.target.checked,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <div>{subjectData?.is_AMSOCA ? "Да" : "Нет"}</div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={toggleShowMore}
              className="text-blue-500 underline mt-4"
            >
              {showMore ? "Скрыть дополнительные данные" : "Показать дополнительные данные"}
            </button>
              
            <h2 className="text-2xl font-bold mb-4">Связанные объекты</h2>
            <div className="flex flex-wrap justify-left">
              {objects.map((object, index) => (
                <div key={index} className="w-full sm:w-1/2 md:w-1/3 px-2">
                  <a href={`/objects/${object.id}`}>
                    <div className="p-5 w-11/12 border border-gray-200 rounded-lg ml-5 mt-5 hover:shadow-md">
                      <h3 className="text-lg font-semibold">{object.object_name}</h3>
                      <p className="text-sm text-gray-500">{formatType(object.object_type)}</p>
                    </div>
                  </a>
                </div>
              ))}
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
    </>
  );
};

export default SingleSubject;

import React, { useState, useEffect } from "react";
import Sidebar from "../../Sidebar/Sidebar";

import CreateObjectModal from "./Modals/CreateObjectModal";

import { axiosInstance } from "../../../../../services/apiConfig";

import "./Objects.css";

import {
  PlusIcon,
} from "@heroicons/react/24/solid";

const ObjectsList = () => {
  const [objectsList, setObjectsList] = useState([]);

  const [isCreateObjectModalOpen, setIsCeateObjectModalOpen] = useState(false);

  const formatType = (type) => {
    if (type === 'ЭПО') {
      return 'ЭПО';
    } else if (type === 'CONSUMER') {
      return 'Потребитель';
    } else if (type === 'РЭК') {
      return 'РЭК';
    }

    return "Неизвестный тип";
  }

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const [objectsResponse] = await Promise.all([
        axiosInstance.get('api/objects/', { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);

      setObjectsList(objectsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="flex objects">
        <Sidebar />
        <div className="flex-1">
          <div className="flex justify-center items-center my-5">
            <button 
              className="flex items-center p-3 rounded-full text-white bg-blue-500 hover:bg-blue-300"
              onClick={() => setIsCeateObjectModalOpen(true)}
            >
              <PlusIcon className="h-5 w-5 mx-2" /> Добавить Объект
            </button>
          </div>
          <hr />
          <h1 className="text-center mt-5 text-gray-500">Выберите объект</h1>
          <div className="flex flex-wrap justify-left">
            {objectsList.map((object, index) => (
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
        </div>
      </div>
      <CreateObjectModal
        isOpen={isCreateObjectModalOpen}
        closeModal={() => setIsCeateObjectModalOpen(false)}
        onSubmit={() => {
          alert('submit');
          fetchData();
        }}
      />
    </>
  )
}

export default ObjectsList;
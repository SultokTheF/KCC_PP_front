import React, { useState, useEffect } from "react";
import Sidebar from "../../Sidebar/Sidebar";

import CreateSubjectModal from "./Modals/CreateSubjectModal";

import { axiosInstance } from "../../../../../services/apiConfig";

import "./Subject.css";

import {
  PlusIcon,
} from "@heroicons/react/24/solid";

const SubjectsList = () => {
  const [subjectsList, setSubjectsList] = useState([]);

  const [isCreateSubjectModalOpen, setIsCreateSubjectModalOpen] = useState(false);

  const formatType = (type) => {
    if (type === 'ЭПО') {
      return 'ЭПО';
    } else if (type === 'CONSUMER') {
      return 'Потребитель';
    } 

    return type;
  }

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const [subjectsResponse] = await Promise.all([
        axiosInstance.get('api/subjects/', { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);

      setSubjectsList(subjectsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="flex subjects">
        <Sidebar />
        <div className="flex-1">
          <div className="flex justify-center items-center my-5">
            <button 
              className="flex items-center p-3 rounded-full text-white bg-blue-500 hover:bg-blue-300"
              onClick={() => setIsCreateSubjectModalOpen(true)}
            >
              <PlusIcon className="h-5 w-5 mx-2" /> Добавить Субъект
            </button>
          </div>  
          <hr />
          <h1 className="text-center mt-5 text-gray-500">Выберите субъект</h1>
          <div className="flex flex-wrap justify-left">
            {subjectsList.map((subject, index) => (
              <div key={index} className="w-full sm:w-1/2 md:w-1/3 px-2">
                <a href={`/subjects/${subject.id}`}>
                  <div className="p-5 border border-gray-200 rounded-lg mt-5 hover:shadow-md">
                    <h3 className="text-lg font-semibold">{subject.subject_name}</h3>
                    <p className="text-sm text-gray-500">{formatType(subject.subject_type)}</p>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CreateSubjectModal
        isOpen={isCreateSubjectModalOpen}
        closeModal={() => setIsCreateSubjectModalOpen(false)}
        onSubmit={() => {
          alert('submit');
          fetchData();
        }}
      />
    </>
  )
}

export default SubjectsList;

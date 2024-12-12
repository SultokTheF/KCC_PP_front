import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";

import CreateUserModal from "./Modals/CreateUserModal";

import { axiosInstance } from "../../../../services/apiConfig";

import {
  PlusIcon,
} from "@heroicons/react/24/solid";

const UsersList = () => {
  const [UsersList, setUsersList] = useState([]);

  const [isCreateUserModalOpen, setIsCeateUserModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const [UsersResponse] = await Promise.all([
        axiosInstance.get('user/users/', { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);

      setUsersList(UsersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="flex Users">
        <Sidebar />
        <div className="flex-1">
          <div className="flex justify-center items-center my-5">
            <button 
              className="flex items-center p-3 rounded-full text-white bg-blue-500 hover:bg-blue-300"
              onClick={() => setIsCeateUserModalOpen(true)}
            >
              <PlusIcon className="h-5 w-5 mx-2" /> Добавить Пользователя
            </button>
          </div>
          <hr />
          <h1 className="text-center mt-5 text-gray-500">Выберите Пользователя</h1>
          <div className="flex flex-wrap justify-left">
            {UsersList.map((user, index) => (
              <div key={index} className="w-full sm:w-1/2 md:w-1/3 px-2">
                <a href={`/users/${user.id}`}>
                  <div className="p-5 w-11/12 border border-gray-200 rounded-lg ml-5 mt-5 hover:shadow-md">
                    <h3 className="text-lg font-semibold">{user.subject_name}</h3>
                    <ul className="max-w-md space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
                      <li>{user.email}</li>
                      <li>{user.subject_bin}</li>
                      <li>{user.role}</li>
                      {user.last_login  && (
                        <li>{new Date(user.last_login).toISOString().split('T')[0]}</li>
                      )}
                    </ul>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        closeModal={() => setIsCeateUserModalOpen(false)}
        onSubmit={() => {
          alert('submit');
          fetchData();
        }}
      />
    </>
  )
}

export default UsersList;
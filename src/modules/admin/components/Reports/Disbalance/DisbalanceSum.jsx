import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../../../../services/apiConfig";

const DisbalanceSum = ({ formData, daysList }) => {
  const [sum, setSum] = useState({
    total_BE_Up: 0,
    total_BE_Down: 0,
    total_OD_Up: 0,
    total_OD_Down: 0,
  });

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const { subject, planMode, factMode, date_from, date_to } = formData;

      const response = await axiosInstance.post(`api/days/disbalanceSum/`,
        {
          subject_id: formData.subject,
          date_from,
          date_to,
        }, 
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

      setSum(response.data);

      console.log(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [formData.subject, formData.planMode, formData.factMode, formData.date_from, formData.date_to, formData.plan, formData.fact]);

  return (
    <table className="table-auto h-3 text-xs text-center w-full border-collapse border border-gray-400">
      <thead>
        <tr>
          <th className="border border-gray-300 px-4">Сумма BE ⬆️</th>
          <th className="border border-gray-300 px-4">Сумма BE ⬇️</th>
          <th className="border border-gray-300 px-4">Сумма OD ⬆️</th>
          <th className="border border-gray-300 px-4">Сумма OD ⬇️</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-300 px-4">{sum.total_BE_Up}</td>
          <td className="border border-gray-300 px-4">{sum.total_BE_Down}</td>
          <td className="border border-gray-300 px-4">{sum.total_OD_Up}</td>
          <td className="border border-gray-300 px-4">{sum.total_OD_Down}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default DisbalanceSum;

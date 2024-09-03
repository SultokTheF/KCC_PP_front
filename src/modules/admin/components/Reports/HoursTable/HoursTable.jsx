import React, { useState, useEffect } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import Sidebar from '../../Sidebar/Sidebar';

const HoursTable = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [hoursByDate, setHoursByDate] = useState({});

  const [formData, setFormData] = useState({
    object: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    subject: 0,
  });

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setSubjectsList(subjectsResponse.data);
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  const fetchHours = async (startDate, endDate, subject) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axiosInstance.get(endpoints.HOURS, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate,
          end_date: endDate,
          sub: subject,
        },
      });

      if (!response.data || response.data.error || response.data.length === 0) {
        console.error('Ошибка при получении часов:', response.data.error || 'Часы не найдены с указанными критериями.');
        setHoursByDate({});
        return;
      }

      // Group hours by date starting from the start date
      const groupedHours = {};
      let currentDay = new Date(startDate);
      let currentDayString = currentDay.toISOString().split('T')[0];
      let hourCounter = 0;

      response.data.forEach((hour, index) => {
        if (hourCounter === 24) {
          currentDay.setDate(currentDay.getDate() + 1);
          currentDayString = currentDay.toISOString().split('T')[0];
          hourCounter = 0;
        }
        if (!groupedHours[currentDayString]) {
          groupedHours[currentDayString] = [];
        }
        groupedHours[currentDayString].push(hour);
        hourCounter++;
      });

      setHoursByDate(groupedHours);
    } catch (error) {
      console.error('Ошибка при получении часов:', error);
      setHoursByDate({});
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.subject) {
      fetchHours(formData.startDate, formData.endDate, formData.subject);
    }
  }, [formData.startDate, formData.endDate, formData.subject]);

  const handleChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Таблица часов</h1>
        <div className="flex flex-col md:flex-row justify-between mt-8 space-y-4 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-1/3">
            <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
              Выберите субъект
            </label>
            <select
              name="subject"
              id="subject"
              className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-full text-gray-700 font-medium mb-2"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              required
            >
              <option value={0}>Субъект</option>
              {subjectsList?.map(subj => (
                <option key={subj.id} value={subj.id}>
                  {subj.subject_name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/3">
            <label htmlFor="startDate" className="block text-gray-700 font-medium mb-2">
              Дата начала
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              className="h-10 border border-gray-300 rounded px-4 focus:outline-none focus:border-blue-500 w-full"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
          </div>
          <div className="w-full md:w-1/3">
            <label htmlFor="endDate" className="block text-gray-700 font-medium mb-2">
              Дата окончания
            </label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              className="h-10 border border-gray-300 rounded px-4 focus:outline-none focus:border-blue-500 w-full"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              required
            />
          </div>
        </div>
        {Object.keys(hoursByDate).map(dayDate => (
          <div key={dayDate} className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Дата: {dayDate.split('-').reverse().join('.')}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border">Час</th>
                    <th className="px-2 py-1 border">P1</th>
                    <th className="px-2 py-1 border">P2</th>
                    <th className="px-2 py-1 border">P3</th>
                    <th className="px-2 py-1 border">F1</th>
                    <th className="px-2 py-1 border">F2</th>
                    <th className="px-2 py-1 border">P1_Gen</th>
                    <th className="px-2 py-1 border">P2_Gen</th>
                    <th className="px-2 py-1 border">P3_Gen</th>
                    <th className="px-2 py-1 border">F1_Gen</th>
                    <th className="px-2 py-1 border">F2_Gen</th>
                    <th className="px-2 py-1 border">BE_Up</th>
                    <th className="px-2 py-1 border">BE_Down</th>
                    <th className="px-2 py-1 border">OD_Up</th>
                    <th className="px-2 py-1 border">OD_Down</th>
                    <th className="px-2 py-1 border">EZ_T</th>
                    <th className="px-2 py-1 border">EZ_Base_T</th>
                    <th className="px-2 py-1 border">Ind_Prov_T</th>
                    <th className="px-2 py-1 border">BE_T</th>
                    <th className="px-2 py-1 border">OD_T</th>
                    <th className="px-2 py-1 border">Ind_T</th>
                    <th className="px-2 py-1 border">Prov_T</th>
                    <th className="px-2 py-1 border">Сообщение</th>
                  </tr>
                </thead>
                <tbody>
                  {hoursByDate[dayDate].map(hour => (
                    <tr key={hour.id}>
                      <td className="px-2 py-1 border">{hour.hour}</td>
                      <td className="px-2 py-1 border">{hour.P1}</td>
                      <td className="px-2 py-1 border">{hour.P2}</td>
                      <td className="px-2 py-1 border">{hour.P3}</td>
                      <td className="px-2 py-1 border">{hour.F1}</td>
                      <td className="px-2 py-1 border">{hour.F2}</td>
                      <td className="px-2 py-1 border">{hour.P1_Gen}</td>
                      <td className="px-2 py-1 border">{hour.P2_Gen}</td>
                      <td className="px-2 py-1 border">{hour.P3_Gen}</td>
                      <td className="px-2 py-1 border">{hour.F1_Gen}</td>
                      <td className="px-2 py-1 border">{hour.F2_Gen}</td>
                      <td className="px-2 py-1 border">{hour.BE_Up}</td>
                      <td className="px-2 py-1 border">{hour.BE_Down}</td>
                      <td className="px-2 py-1 border">{hour.OD_Up}</td>
                      <td className="px-2 py-1 border">{hour.OD_Down}</td>
                      <td className="px-2 py-1 border">{hour.EZ_T}</td>
                      <td className="px-2 py-1 border">{hour.EZ_Base_T}</td>
                      <td className="px-2 py-1 border">{hour.Ind_Prov_T}</td>
                      <td className="px-2 py-1 border">{hour.BE_T}</td>
                      <td className="px-2 py-1 border">{hour.OD_T}</td>
                      <td className="px-2 py-1 border">{hour.Ind_T}</td>
                      <td className="px-2 py-1 border">{hour.Prov_T}</td>
                      <td className="px-2 py-1 border">{hour.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoursTable;

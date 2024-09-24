import React, { useState, useEffect } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import Sidebar from '../../Sidebar/Sidebar';

const HoursTable = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [hoursByDate, setHoursByDate] = useState({});
  const [providersList, setProvidersList] = useState([]);
  const [selectedProviderSubjects, setSelectedProviderSubjects] = useState([]);
  const [providerError, setProviderError] = useState('');

  const [formData, setFormData] = useState({
    object: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    subject: 0,
    hour: 1, // New state for hour selection
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

  const fetchHours = async (startDate, endDate, subject, startHour) => {
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

      const groupedHours = {};
      let currentDay = new Date(startDate);
      let currentDayString = currentDay.toISOString().split('T')[0];
      let hourCounter = startHour - 1; // Start from the selected hour

      response.data.forEach((hour) => {
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
      fetchHours(formData.startDate, formData.endDate, formData.subject, formData.hour); // Pass the selected hour
    }
  }, [formData.startDate, formData.endDate, formData.subject, formData.hour]);

  const handleChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Таблица часов</h1>
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Subject Selector */}
            <div className="w-full">
              <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
                Выберите субъект
              </label>
              <select
                name="subject"
                id="subject"
                className="w-full h-12 border border-gray-300 rounded-lg px-4"
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

            {/* Start Date Selector */}
            <div className="w-full">
              <label htmlFor="startDate" className="block text-gray-700 font-medium mb-2">
                Дата начала
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                className="w-full h-12 border border-gray-300 rounded-lg px-4"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>

            {/* End Date Selector */}
            <div className="w-full">
              <label htmlFor="endDate" className="block text-gray-700 font-medium mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                className="w-full h-12 border border-gray-300 rounded-lg px-4"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                required
              />
            </div>

            {/* Hour Selector */}
            <div className="w-full">
              <label htmlFor="hour" className="block text-gray-700 font-medium mb-2">
                Час начала
              </label>
              <input
                type="number"
                name="hour"
                id="hour"
                className="w-full h-12 border border-gray-300 rounded-lg px-4"
                value={formData.hour}
                onChange={(e) => handleChange('hour', e.target.value)}
                min="1"
                max="24"
                required
              />
            </div>
          </div>
        </div>

        {/* Table displaying hours by date */}
        {Object.keys(hoursByDate).map(dayDate => (
          <div key={dayDate} className="mt-8">
            <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">
              Дата: {dayDate.split('-').reverse().join('.')}
            </h2>
            <div className="overflow-x-auto max-w-[1550px] bg-white shadow-md rounded-lg">
              <table className="table-fixed min-w-full text-sm bg-white border border-gray-200">
                <thead className="bg-gray-100 text-center">
                  <tr>
                    {[
                      "Час",
                      "coefficient", "volume",
                      "P1", "P2", "P3", "F1", "F2",
                      "P1_Gen", "P2_Gen", "P3_Gen", "F1_Gen", "F2_Gen",
                      "EZ_T", "EZ_Base_T",
                      "EZ_T_ВИЭ", "EZ_T_РЭК",
                      "Pred_T", "Wo_Prov_T", "W_Prov_T",
                      "BE_T", "OD_T",
                      "T_Coef",
                      "direction",
                      "message"
                    ].map((header) => (
                      <th key={header} className="px-2 py-1 border-b border-gray-200 font-medium text-gray-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hoursByDate[dayDate].map(hour => (
                    <tr key={hour.id} className="even:bg-gray-50 text-center">
                      <td className="px-2 py-1 border-b border-gray-200">{hour.hour}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.coefficient}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.volume}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.P1}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.P2}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.P3}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.F1}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.F2}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.P1_Gen}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.P2_Gen}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.P3_Gen}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.F1_Gen}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.F2_Gen}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.EZ_T}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.EZ_Base_T}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.EZ_T_ВИЭ}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.EZ_T_РЭК}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.Pred_T}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.Wo_Prov_T}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.W_Prov_T}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.BE_T}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.OD_T}</td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.T_Coef}</td>
                      <td className={`px-2 py-1 border-b border-gray-200 ${hour.direction === 'DOWN' ? 'bg-green-100' : hour.direction === 'UP' ? 'bg-red-100' : ''}`}>
                        {hour.direction === 'UP' ? '↑' : hour.direction === 'DOWN' ? '↓' : '-'}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-200">{hour.message}</td>
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

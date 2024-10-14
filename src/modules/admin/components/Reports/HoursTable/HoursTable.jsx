// HoursTable.js
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs'; // Import Day.js for date manipulation
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import Sidebar from '../../Sidebar/Sidebar';

// Tailwind CSS spinner component
const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="w-12 h-12 border-4 border-blue-500 border-solid border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const HoursTable = () => {
  // State for subjects list
  const [subjectsList, setSubjectsList] = useState([]);

  // State for form inputs
  const [formData, setFormData] = useState({
    object: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    subject: 0,
    startHour: 1,
    endHour: 24,
  });

  // Loading state
  const [loading, setLoading] = useState(false);

  // State to hold merged table data
  const [tableData, setTableData] = useState([]);

  // Fetch subjects on component mount
  const fetchSubjects = async () => {
    try {
      const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
      console.log('Fetched subjects:', subjectsResponse.data);
      setSubjectsList(subjectsResponse.data);
    } catch (error) {
      console.error('Ошибка при получении субъектов:', error);
    }
  };

  // Fetch hours data
  const fetchHours = async () => {
    try {
      const response = await axiosInstance.get(endpoints.HOURS, {
        params: {
          start_date: formData.startDate,
          end_date: formData.endDate,
          sub: formData.subject,
        },
      });

      console.log('Fetched hours:', response.data);

      if (!response.data || response.data.error || response.data.length === 0) {
        console.error(
          'Ошибка при получении часов:',
          response.data?.error || 'Часы не найдены с указанными критериями.'
        );
        return [];
      }

      // Filter hours based on startHour and endHour
      const filteredHours = response.data.filter(
        (hour) => hour.hour >= formData.startHour && hour.hour <= formData.endHour
      );

      console.log('Filtered hours:', filteredHours);

      return filteredHours;
    } catch (error) {
      console.error('Ошибка при получении часов:', error);
      return [];
    }
  };

  // Fetch base tariffs data
  const fetchBaseTariffs = async () => {
    try {
      const response = await axiosInstance.get(endpoints.BASE_TARIFF, {
        params: {
          start_date: formData.startDate,
          end_date: formData.endDate,
          sub: formData.subject,
        },
      });

      console.log('Fetched base tariffs:', response.data);

      if (!response.data || response.data.error || response.data.length === 0) {
        if (response.data?.error === "No BaseTariffs found with the provided criteria.") {
          console.warn('No BaseTariffs found, filling tariffs with zeroes.');
        } else {
          console.error(
            'Ошибка при получении базовых тарифов:',
            response.data?.error || 'Базовые тарифы не найдены с указанными критериями.'
          );
        }
        return [];
      }

      // Filter tariffs where 'subjects' includes the selected subject
      const filteredTariffs = response.data.filter((tariff) =>
        tariff.subjects.includes(formData.subject)
      );

      console.log('Filtered base tariffs:', filteredTariffs);

      return filteredTariffs;
    } catch (error) {
      if (
        error.response &&
        error.response.data.error === "No BaseTariffs found with the provided criteria."
      ) {
        console.warn('No BaseTariffs found, filling tariffs with zeroes.');
      } else {
        console.error('Ошибка при получении базовых тарифов:', error);
      }
      return [];
    }
  };

  // Fetch providers data
  const fetchProviders = async (dates, subject) => {
    try {
      const response = await axiosInstance.get(endpoints.PROVIDERS, {
        params: {
          sub: subject,
          start_date: formData.startDate,
          end_date: formData.endDate,
        },
      });

      console.log('Fetched providers:', response.data);

      if (!response.data || response.data.error || response.data.length === 0) {
        console.warn('No providers found for the given criteria.');
        return {};
      }

      // Assuming the response includes a date field for each provider entry
      // and that providers are associated with specific dates
      const providersMap = {};
      response.data.forEach((provider) => {
        const date = provider.date.split('T')[0]; // Extract date in YYYY-MM-DD
        if (!providersMap[date]) {
          providersMap[date] = [];
        }
        providersMap[date].push(provider.name);
      });

      console.log('Providers Map:', providersMap);

      return providersMap;
    } catch (error) {
      console.error('Ошибка при получении провайдеров:', error);
      return {};
    }
  };

  // Merge hours, tariffs, and providers data
  const mergeData = (hours, tariffs, providersMap) => {
    console.log('Merging data...');
    console.log('Hours:', hours);
    console.log('Tariffs:', tariffs);
    console.log('Providers Map:', providersMap);

    // Create a map for tariffs based on date and hour for quick lookup
    const tariffMap = {};
    tariffs.forEach((tariff) => {
      const date = tariff.date.split('T')[0]; // Extract date in YYYY-MM-DD
      const key = `${date}_${tariff.hour}`;
      tariffMap[key] = tariff;
    });

    console.log('Tariff Map:', tariffMap);

    // Assign date to each hour
    const startDate = dayjs(formData.startDate);
    const mergedData = hours.map((hour, index) => {
      // Calculate the date based on the hour index
      const dayOffset = Math.floor(index / 24);
      const date = startDate.add(dayOffset, 'day').format('YYYY-MM-DD');

      // Fetch base tariff for this date and hour
      const key = `${date}_${hour.hour}`;
      const baseTariff = tariffMap[key];

      // Fetch providers for this date
      const providers = providersMap[date] ? providersMap[date].join(', ') : 'Нет Провайдеров';

      const subjectInfo = subjectsList.find((subj) => subj.id === formData.subject);
      const subjectName = subjectInfo ? subjectInfo.subject_name : 'Неизвестный субъект';
      const subjectType = subjectInfo
        ? subjectInfo.subject_type === 'CONSUMER'
          ? 'Потребитель'
          : subjectInfo.subject_type
        : 'Неизвестный тип';

      return {
        id: hour.id,
        date: date, // New Date Column
        hour: hour.hour,
        coefficient: hour.coefficient,
        volume: hour.volume,
        P1: hour.P1,
        P2: hour.P2,
        P3: hour.P3,
        F1: hour.F1,
        F2: hour.F2,
        P1_Gen: hour.P1_Gen,
        P2_Gen: hour.P2_Gen,
        P3_Gen: hour.P3_Gen,
        F1_Gen: hour.F1_Gen,
        F2_Gen: hour.F2_Gen,
        Pred_T: hour.Pred_T,
        plan_t: hour.plan_t,
        Wo_Prov_T: hour.Wo_Prov_T,
        W_Prov_T: hour.W_Prov_T,
        EZ_T: baseTariff ? baseTariff.EZ_T : 0.0,
        EZ_Base_T: baseTariff ? baseTariff.EZ_Base_T : 0.0,
        BE_T: baseTariff ? baseTariff.BE_T : 0.0,
        OD_T: baseTariff ? baseTariff.OD_T : 0.0,
        EZ_T_ВИЭ: baseTariff ? baseTariff.EZ_T_ВИЭ : 0.0,
        EZ_T_РЭК: baseTariff ? baseTariff.EZ_T_РЭК : 0.0,
        T_Coef: hour.T_Coef,
        direction: baseTariff ? baseTariff.direction : '-',
        message: hour.message,
        subject: subjectName,
        type: subjectType,
        providers: providers, // Assigned Providers
      };
    });

    console.log('Merged Data:', mergedData);

    return mergedData;
  };

  // Fetch and merge data
  const fetchAndMergeData = async () => {
    setLoading(true);
    try {
      // Step 1: Fetch hours
      const hours = await fetchHours();

      if (hours.length === 0) {
        setTableData([]);
        return;
      }

      // Step 2: Fetch base tariffs
      const baseTariffs = await fetchBaseTariffs();

      if (baseTariffs.length === 0) {
        console.warn('No base tariffs found, proceeding with hours data only.');
      }

      // Step 3: Fetch providers
      // Collect unique dates based on the number of hours and startDate
      const totalDays = Math.ceil(hours.length / 24);
      const startDate = dayjs(formData.startDate);
      const dates = Array.from({ length: totalDays }, (_, i) =>
        startDate.add(i, 'day').format('YYYY-MM-DD')
      );

      const providersMap = await fetchProviders(dates, formData.subject);

      // Step 4: Merge data
      const mergedData = mergeData(hours, baseTariffs, providersMap);
      setTableData(mergedData);
    } catch (error) {
      console.error('Ошибка при обработке данных:', error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Fetch subjects on component mount
  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch and merge data when formData changes
  useEffect(() => {
    if (formData.subject !== 0 && formData.startDate && formData.endDate) {
      fetchAndMergeData();
    } else {
      setTableData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Таблица часов
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Subject Selection */}
            <div className="w-full">
              <label htmlFor="subject" className="block text-gray-700 font-semibold mb-2">
                Выберите субъект
              </label>
              <select
                name="subject"
                id="subject"
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.subject}
                onChange={(e) => handleChange('subject', parseInt(e.target.value))}
                required
              >
                <option value={0}>Субъект</option>
                {subjectsList?.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.subject_name}
                  </option>
                ))}
              </select>
            </div>
            {/* Start Date */}
            <div className="w-full">
              <label htmlFor="startDate" className="block text-gray-700 font-semibold mb-2">
                Дата начала
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>
            {/* End Date */}
            <div className="w-full">
              <label htmlFor="endDate" className="block text-gray-700 font-semibold mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                required
              />
            </div>
            {/* Start Hour */}
            <div className="w-full">
              <label htmlFor="startHour" className="block text-gray-700 font-semibold mb-2">
                Час начала
              </label>
              <select
                name="startHour"
                id="startHour"
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.startHour}
                onChange={(e) => handleChange('startHour', parseInt(e.target.value))}
                required
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            {/* End Hour */}
            <div className="w-full">
              <label htmlFor="endHour" className="block text-gray-700 font-semibold mb-2">
                Час окончания
              </label>
              <select
                name="endHour"
                id="endHour"
                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.endHour}
                onChange={(e) => handleChange('endHour', parseInt(e.target.value))}
                required
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <Spinner />
        ) : (
          // Table Rendering
          tableData.length > 0 ? (
            <div className="overflow-x-auto max-w-[1550px] bg-white shadow-md rounded-lg">
              <table className="table-fixed min-w-full text-sm bg-white border border-gray-200">
                <thead className="bg-gray-100 text-center">
                  <tr>
                    {[
                      'Дата',          // New Date Column
                      'Час',
                      'Субъект',
                      'Провайдеры',
                      'Тип',
                      'coefficient',
                      'volume',
                      'P1',
                      'P2',
                      'P3',
                      'F1',
                      'F2',
                      'P1_Gen',
                      'P2_Gen',
                      'P3_Gen',
                      'F1_Gen',
                      'F2_Gen',
                      'EZ_T',
                      'EZ_Base_T',
                      'EZ_T_ВИЭ',
                      'EZ_T_РЭК',
                      'Pred_T',
                      'plan_T',
                      'Wo_Prov_T',
                      'W_Prov_T',
                      'BE_T',
                      'OD_T',
                      'T_Coef',
                      'direction',
                      'message',
                    ].map((header) => (
                      <th
                        key={header}
                        className={`px-2 py-1 border-b border-gray-200 font-medium text-gray-700 ${
                          header === 'Дата' ? 'w-48' : ''
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => {
                    const isNewDate = index === 0 || row.date !== tableData[index - 1].date;
                    return (
                      <tr
                        key={row.id}
                        className={`text-center ${
                          isNewDate ? 'bg-gray-100' : 'bg-white'
                        }`}
                      >
                        {/* Date Column */}
                        <td className="px-2 py-1 border-b w-48 border-gray-200">
                          {row.date}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.hour}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.subject}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.providers}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.type}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.coefficient}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.volume}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.P1}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.P2}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.P3}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.F1}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.F2}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.P1_Gen}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.P2_Gen}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.P3_Gen}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.F1_Gen}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.F2_Gen}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.EZ_T}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.EZ_Base_T}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.EZ_T_ВИЭ}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.EZ_T_РЭК}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.Pred_T}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.plan_t}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.Wo_Prov_T}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.W_Prov_T}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.BE_T}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.OD_T}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.T_Coef}
                        </td>
                        <td
                          className={`px-2 py-1 border-b border-gray-200 ${
                            row.direction === 'DOWN'
                              ? 'bg-green-100'
                              : row.direction === 'UP'
                              ? 'bg-red-100'
                              : ''
                          }`}
                        >
                          {row.direction === 'UP'
                            ? '↑'
                            : row.direction === 'DOWN'
                            ? '↓'
                            : '-'}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-200">
                          {row.message}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500">Нет данных для отображения.</div>
          )
        )}
      </div>
    </div>
  );
};

export default HoursTable;

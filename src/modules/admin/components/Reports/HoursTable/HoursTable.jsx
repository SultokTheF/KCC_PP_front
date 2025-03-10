// HoursTable.jsx
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import Sidebar from '../../Sidebar/Sidebar';

// Simple Tailwind CSS spinner
const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="w-12 h-12 border-4 border-blue-500 border-solid border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const HoursTable = () => {
  // ─────────────────────────────────────────────────────────────────────────────
  //  State
  // ─────────────────────────────────────────────────────────────────────────────
  const [subjectsList, setSubjectsList] = useState([]);

  // Form inputs
  const [formData, setFormData] = useState({
    object: 0,
    startDate: dayjs().format('YYYY-MM-DD'), // e.g. "2025-03-13"
    endDate: dayjs().format('YYYY-MM-DD'),
    subject: 0,
    startHour: 1,
    endHour: 24,
  });

  const [loading, setLoading] = useState(false);
  const [isConsumer, setIsConsumer] = useState(true);

  // Final table data
  const [tableData, setTableData] = useState([]);

  // Map of day objects from server: dayId -> day object
  const [dayMap, setDayMap] = useState({});

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch Subjects
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchSubjects = async () => {
    try {
      const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
      setSubjectsList(subjectsResponse.data);
    } catch (error) {
      console.error('Ошибка при получении субъектов:', error);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch Hours
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchHours = async () => {
    try {
      const response = await axiosInstance.get(endpoints.HOURS, {
        params: {
          start_date: formData.startDate,
          end_date: formData.endDate,
          sub: formData.subject,
        },
      });

      if (!response.data || response.data.error || response.data.length === 0) {
        console.error(
          'Ошибка при получении часов:',
          response.data?.error || 'Часы не найдены с указанными критериями.'
        );
        return [];
      }

      // Filter by startHour/endHour
      const filteredHours = response.data.filter(
        (hour) => hour.hour >= formData.startHour && hour.hour <= formData.endHour
      );
      return filteredHours;
    } catch (error) {
      console.error('Ошибка при получении часов:', error);
      return [];
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch Base Tariffs
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchBaseTariffs = async () => {
    try {
      const response = await axiosInstance.get(endpoints.BASE_TARIFF, {
        params: {
          start_date: formData.startDate,
          end_date: formData.endDate,
          sub: formData.subject,
        },
      });

      if (!response.data || response.data.error || response.data.length === 0) {
        if (response.data?.error === 'No BaseTariffs found with the provided criteria.') {
          console.warn('No BaseTariffs found, proceeding with zeros.');
        } else {
          console.error(
            'Ошибка при получении базовых тарифов:',
            response.data?.error || 'Базовые тарифы не найдены с указанными критериями.'
          );
        }
        return [];
      }

      // Filter tariffs for this subject
      const filteredTariffs = response.data.filter((tariff) =>
        tariff.subjects.includes(formData.subject)
      );
      return filteredTariffs;
    } catch (error) {
      if (
        error.response &&
        error.response.data.error === 'No BaseTariffs found with the provided criteria.'
      ) {
        console.warn('No BaseTariffs found, using zeros.');
      } else {
        console.error('Ошибка при получении базовых тарифов:', error);
      }
      return [];
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch Providers
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchProviders = async (subjectId) => {
    try {
      const response = await axiosInstance.get(endpoints.PROVIDERS, {
        params: {
          sub: subjectId,
          // The API wants YYYY-MM
          start_date: dayjs(formData.startDate).format('YYYY-MM'),
          end_date: dayjs(formData.endDate).format('YYYY-MM'),
        },
      });

      if (!response.data || response.data.error || response.data.length === 0) {
        console.warn('No providers found for given criteria.');
        return {};
      }

      // Build a map: { 'YYYY-MM': ['Provider1', 'Provider2'], ... }
      const providersMap = {};
      response.data.forEach((provider) => {
        const month = provider.month; // e.g. "2025-03"
        if (!providersMap[month]) {
          providersMap[month] = [];
        }
        providersMap[month].push(provider.name);
      });
      return providersMap;
    } catch (error) {
      console.error('Ошибка при получении провайдеров:', error);
      return {};
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch Day Objects
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * For each unique day ID in hours, call endpoints.DAYS/<dayId> to get
   * the real date from the server, etc.
   */
  const fetchDayObjects = async (hoursArray) => {
    const uniqueDayIds = [...new Set(hoursArray.map((h) => h.day))];
    const dayMapTemp = {};

    for (const dayId of uniqueDayIds) {
      try {
        // The exact URL might differ if your endpoint doesn't require a slash
        // For example: endpoints.DAYS + dayId might be "api/days/10565/"
        // Adjust as needed:
        const response = await axiosInstance.get(`${endpoints.DAYS}${dayId}/`);
        dayMapTemp[dayId] = response.data;
      } catch (error) {
        console.error(`Ошибка при получении day ID ${dayId}:`, error);
        dayMapTemp[dayId] = null;
      }
    }

    setDayMap(dayMapTemp);
    return dayMapTemp;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Merge Data
  // ─────────────────────────────────────────────────────────────────────────────
  const mergeData = (hours, tariffs, providersMap, dayMapObj) => {
    // Build a quick map of baseTariffs by (YYYY-MM-DD + '_' + hour)
    const tariffMap = {};
    tariffs.forEach((tariff) => {
      // e.g. "2025-03-13T00:00:00+01:00"
      const datePart = tariff.date.split('T')[0]; // => "2025-03-13"
      const key = `${datePart}_${tariff.hour}`;
      tariffMap[key] = tariff;
    });

    // Create final table rows
    const mergedData = hours.map((hour) => {
      const dayObj = dayMapObj[hour.day];
      // If dayObj is missing, fallback
      if (!dayObj) {
        return {
          id: hour.id,
          date: '', // no date available
          dateRaw: null,
          hour: hour.hour,
          subject: 'Неизвестный субъект',
          type: 'Неизвестный тип',
          providers: 'Нет Провайдеров',
          P1: hour.P1,
          P2: hour.P2,
          P3: hour.P3,
          F1: hour.F1,
          F2: hour.F2,
          // If you want gen columns for non-consumers
          P1_Gen: hour.P1_Gen,
          P2_Gen: hour.P2_Gen,
          P3_Gen: hour.P3_Gen,
          F1_Gen: hour.F1_Gen,
          F2_Gen: hour.F2_Gen,
          EZ_T: 0.0,
          EZ_Base_T: 0.0,
          BE_T: 0.0,
          OD_T: 0.0,
          EZ_T_ВИЭ: 0.0,
          EZ_T_РЭК: 0.0,
          message: hour.message,
        };
      }

      // dayObj.date => "2025-03-13T00:00:00+01:00"
      const dayDate = dayjs(dayObj.date);
      const dateFormatted = dayDate.isValid() ? dayDate.format('DD-MM-YYYY') : '';

      // Build key for baseTariff
      const datePart = dayDate.format('YYYY-MM-DD'); // e.g. "2025-03-13"
      const tariffKey = `${datePart}_${hour.hour}`;
      const baseTariff = tariffMap[tariffKey];

      // Providers: month-based
      const monthPart = dayDate.format('YYYY-MM'); // e.g. "2025-03"
      const providers = providersMap[monthPart] ? providersMap[monthPart].join(', ') : 'Нет Провайдеров';

      // Subject info
      const subjectInfo = subjectsList.find((s) => s.id === formData.subject);
      const subjectName = subjectInfo ? subjectInfo.subject_name : 'Неизвестный субъект';
      const subjectType = subjectInfo
        ? subjectInfo.subject_type === 'CONSUMER'
          ? 'Потребитель'
          : subjectInfo.subject_type
        : 'Неизвестный тип';

      return {
        id: hour.id,
        // We'll store the raw dayjs date for sorting, but display the formatted version
        date: dateFormatted,
        dateRaw: dayDate, // for sorting
        hour: hour.hour,
        subject: subjectName,
        type: subjectType,
        providers,
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
        EZ_T: baseTariff ? baseTariff.EZ_T : 0.0,
        EZ_Base_T: baseTariff ? baseTariff.EZ_Base_T : 0.0,
        BE_T: baseTariff ? baseTariff.BE_T : 0.0,
        OD_T: baseTariff ? baseTariff.OD_T : 0.0,
        EZ_T_ВИЭ: baseTariff ? baseTariff.EZ_T_ВИЭ : 0.0,
        EZ_T_РЭК: baseTariff ? baseTariff.EZ_T_РЭК : 0.0,
        message: hour.message,
      };
    });

    // Now sort by date ascending, then by hour ascending
    mergedData.sort((a, b) => {
      // If either dateRaw is invalid, handle accordingly
      if (!a.dateRaw && !b.dateRaw) return 0;
      if (!a.dateRaw) return 1; // put it at the bottom
      if (!b.dateRaw) return -1; 
      // Compare the dayjs objects
      if (a.dateRaw.isBefore(b.dateRaw)) return -1;
      if (a.dateRaw.isAfter(b.dateRaw)) return 1;
      // If same date, sort by hour
      return a.hour - b.hour;
    });

    return mergedData;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch & Merge
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchAndMergeData = async () => {
    setLoading(true);
    try {
      // 1) Hours
      const hours = await fetchHours();
      if (hours.length === 0) {
        setTableData([]);
        return;
      }

      // 2) Day objects
      const dayMapObj = await fetchDayObjects(hours);

      // 3) Base Tariffs
      const baseTariffs = await fetchBaseTariffs();

      // 4) Providers
      const providersMap = await fetchProviders(formData.subject);

      // 5) Merge
      const merged = mergeData(hours, baseTariffs, providersMap, dayMapObj);
      setTableData(merged);
    } catch (error) {
      console.error('Ошибка при обработке данных:', error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    if (name === 'subject') {
      const selectedSubject = subjectsList.find((subj) => subj.id === value);
      setIsConsumer(selectedSubject?.subject_type === 'CONSUMER');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Effects
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.subject !== 0 && formData.startDate && formData.endDate) {
      fetchAndMergeData();
    } else {
      setTableData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // ─────────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Таблица часов
        </h1>

        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Subject */}
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

        {/* Table or Spinner */}
        {loading ? (
          <Spinner />
        ) : tableData.length > 0 ? (
          <div className="overflow-x-auto max-w-[1550px] bg-white shadow-md rounded-lg">
            <table className="table-fixed min-w-full text-sm bg-white border border-gray-200">
              <thead className="bg-gray-100 text-center">
                <tr>
                  {[
                    'Дата',       // dd-mm-yyyy
                    'Час',
                    'Субъект',
                    'Тип',
                    'Провайдеры',
                    // Removed coefficient & volume
                    'P1',
                    'P2',
                    'P3',
                    'F1',
                    'F2',
                    // Generation columns if not consumer
                    ...(!isConsumer
                      ? ['P1_Gen', 'P2_Gen', 'P3_Gen', 'F1_Gen', 'F2_Gen']
                      : []),
                    'EZ_T',
                    'EZ_Base_T',
                    'BE_T',
                    'OD_T',
                    'EZ_T_ВИЭ',
                    'EZ_T_РЭК',
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-2 py-1 border-b border-gray-200 font-medium text-gray-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr key={row.id} className="text-center">
                    <td className="px-2 py-1 border-b border-gray-200">
                      {row.date}
                    </td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.hour}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.subject}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.type}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.providers}</td>

                    {/* P1, P2, P3, F1, F2 */}
                    <td className="px-2 py-1 border-b border-gray-200">{row.P1}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.P2}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.P3}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.F1}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.F2}</td>

                    {/* Generation columns if not consumer */}
                    {!isConsumer && (
                      <>
                        <td className="px-2 py-1 border-b border-gray-200">{row.P1_Gen}</td>
                        <td className="px-2 py-1 border-b border-gray-200">{row.P2_Gen}</td>
                        <td className="px-2 py-1 border-b border-gray-200">{row.P3_Gen}</td>
                        <td className="px-2 py-1 border-b border-gray-200">{row.F1_Gen}</td>
                        <td className="px-2 py-1 border-b border-gray-200">{row.F2_Gen}</td>
                      </>
                    )}

                    {/* Tariffs */}
                    <td className="px-2 py-1 border-b border-gray-200">{row.EZ_T}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.EZ_Base_T}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.BE_T}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.OD_T}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.EZ_T_ВИЭ}</td>
                    <td className="px-2 py-1 border-b border-gray-200">{row.EZ_T_РЭК}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500">Нет данных для отображения.</div>
        )}
      </div>
    </div>
  );
};

export default HoursTable;

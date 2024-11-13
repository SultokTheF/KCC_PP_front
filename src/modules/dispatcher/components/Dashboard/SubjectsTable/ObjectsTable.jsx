import React, { useState, useEffect } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import useDataFetching from '../../../../../hooks/useDataFetching';
// import CreatePlanModal from '../CreatePlanModal/CreatePlanModal';

const timeIntervals = [
  '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
  '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
  '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
  '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00',
];

const ObjectTable = ({ selectedData, setSelectedData, objectsList, selectedDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedObject = objectsList.find(object => object.id === selectedData.selectedObject);

  const { daysList, hoursList } = useDataFetching(selectedDate, selectedData.selectedObject, 'object');

  const dayPlan = daysList?.find(day => day.object === selectedObject?.id && day.date.split('T')[0] === selectedDate.split('T')[0]);
  const hourPlan = hoursList?.filter(hour => hour.day === dayPlan?.id);

  const [planData, setPlanData] = useState({
    planMode: 'P1',
    isGen: false,
  });

  // Status Display Map
  const statusDisplayMap = {
    "PRIMARY_PLAN": "-П1-",
    "KCCPP_PLAN": "-П1-П2",
    "KEGOS_PLAN": "-П1-П2-П3-",
    "FACT1": "-П1-П2-П3-Ф1",
    "FACT2": "-П1-П2-П3-Ф1-Ф2",
    "COMPLETED": "Завершен",
    "Ошибка при загрузке": "Нет данных",
    // ... add other statuses if necessary
  };

  // State Variables for Status Management
  const [statusMap, setStatusMap] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusError, setStatusError] = useState(null);

  // Asynchronous Function to Fetch Status
  const getPlanStatus = async (date, object) => {
    try {
      const response = await axiosInstance.get(endpoints.GET_STATUS, {
        params: {
          date,
          object: object.id,
        },
      });
      return response.data.status || "Нет данных";
    } catch (error) {
      console.error(`Error fetching status for object ${object.id}:`, error);
      return "Ошибка при загрузке";
    }
  };

  // Fetch All Statuses When selectedDate or objectsList Change
  useEffect(() => {
    const fetchAllStatuses = async () => {
      setLoadingStatuses(true);
      setStatusError(null);
      const newStatusMap = {};

      try {
        const statusPromises = objectsList.map((object) =>
          getPlanStatus(selectedDate, object).then((status) => ({
            id: object.id,
            status,
          }))
        );

        const statuses = await Promise.all(statusPromises);

        statuses.forEach(({ id, status }) => {
          newStatusMap[id] = status;
        });

        setStatusMap(newStatusMap);
      } catch (error) {
        setStatusError("Ошибка при загрузке статусов.");
        console.error("Error fetching statuses:", error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    if (selectedDate && objectsList.length > 0) {
      fetchAllStatuses();
    }
  }, [selectedDate, objectsList]);

  // Filter Objects Based on Selected Subject
  const objects = objectsList.filter(object => object.subject === selectedData.selectedSubject);

  // Set Default Selected Object if Not Already Selected
  useEffect(() => {
    if (!selectedData.selectedObject && objects.length > 0) {
      setSelectedData(prevData => ({
        ...prevData,
        selectedObject: objects[0]?.id || 0,
      }));
    }
  }, [selectedData.selectedSubject, objects, setSelectedData]);

  return (
    <>
      {/* Status Table */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th>{'Объект'}</th>
            {objects.map(object => (
              <th key={object.id}>{object.object_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border" scope="row">Статус</td>
            {objects.map(object => (
              <td
                key={object.id}
                className={`border hover:bg-blue-100 cursor-pointer ${selectedData.selectedObject === object.id ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setSelectedData(prevData => ({
                  ...prevData,
                  selectedObject: object.id,
                }))}
              >
                {loadingStatuses ? (
                  "Загрузка..."
                ) : statusError ? (
                  statusError
                ) : (
                  statusDisplayMap[statusMap[object.id]] || "Нет данных"
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end space-x-2 my-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          // onClick={handleImportFromFile}
        >
          Импорт из файла (для кэфов)
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          // onClick={handleExport}
        >
          Экспорт(для кэфов)
        </button>
      </div>

      {/* Plan Tables */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            {/* <th></th> */}
            <th>
              П1
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГП1
              </th>
            )}
            <th>
              Объем
            </th>
            <th>
              П2
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГП2
              </th>
            )}
            <th>
              П3
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГП3
              </th>
            )}
            <th>
              Ф
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                Гф
              </th>
            )}
            <th>Сообщение П2</th>
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              {/* <td className="border">{time}</td> */}
              <td className="border">{hourPlan[index]?.P1 || 0}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P1_Gen || 0}</td>}
              <td className='border'>0</td>
              <td className="border">{hourPlan[index]?.P2 || 0}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P2_Gen || 0}</td>}
              <td className="border">{hourPlan[index]?.P3 || 0}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P3_Gen || 0}</td>}
              <td className="border">{hourPlan[index]?.F1 || 0}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan[index]?.F1_Gen || 0}</td>}
              <td className="border">{hourPlan[index]?.P2_message || '-'}</td>
              {/* Repeat for other columns... */}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default ObjectTable;

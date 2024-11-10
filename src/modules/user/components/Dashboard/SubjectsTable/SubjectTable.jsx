// src/components/Dashboard/SubjectsTable/SubjectTable.js
import React, { useState, useEffect } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import useDataFetching from '../../../../../hooks/useDataFetching';

const timeIntervals = [
  '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
  '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
  '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
  '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00',
];

const SubjectTable = ({ selectedData, setSelectedData, subjectsList, selectedDate }) => {
  const selectedSubject = subjectsList.find(subject => subject.id === selectedData.selectedSubject);

  const { daysList, hoursList } = useDataFetching(selectedDate, selectedData.selectedSubject, 'subject');

  const dayPlan = daysList?.find(day => day.subject === selectedSubject?.id && day.date.split('T')[0] === selectedDate.split('T')[0]);
  const hourPlan = hoursList?.filter(hour => hour.day === dayPlan?.id);

  // State Variables for Status Management
  const [statusMap, setStatusMap] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusError, setStatusError] = useState(null);

  // Status Display Map
  const statusDisplayMap = {
    "PRIMARY_PLAN": "Первичный план",
    "KCCPP_PLAN": "План КЦПП",
    "KEGOS_PLAN": "План КЕГОС",
    "FACT1": "Факт 1",
    "FACT2": "Факт 2",
    "COMPLETED": "Завершен",
    "Ошибка при загрузке": "Нет данных",
    // ... add other statuses if necessary
  };

  // Asynchronous Function to Fetch Status
  const getPlanStatus = async (date, subject) => {
    try {
      const response = await axiosInstance.get(endpoints.GET_STATUS, {
        params: {
          date,
          subject: subject.id,
        },
      });
      return response.data.status || "Нет данных";
    } catch (error) {
      console.error(`Error fetching status for subject ${subject.id}:`, error);
      return "Ошибка при загрузке";
    }
  };

  // Fetch All Statuses When selectedDate or subjectsList Change
  useEffect(() => {
    const fetchAllStatuses = async () => {
      setLoadingStatuses(true);
      setStatusError(null);
      const newStatusMap = {};

      try {
        const statusPromises = subjectsList.map((subject) =>
          getPlanStatus(selectedDate, subject).then((status) => ({
            id: subject.id,
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

    if (selectedDate && subjectsList.length > 0) {
      fetchAllStatuses();
    }
  }, [selectedDate, subjectsList]);

  // Set Default Selected Subject if Not Already Selected
  useEffect(() => {
    if (!selectedData.selectedSubject && subjectsList.length > 0) {
      setSelectedData(prevData => ({
        ...prevData,
        selectedSubject: subjectsList[0]?.id || 0,
      }));
    }
  }, [subjectsList, setSelectedData, selectedData.selectedSubject]);

  return (
    <>
      {/* Status Table */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th>{'Субъект'}</th>
            {subjectsList.map(subject => (
              <th key={subject.id}>{subject.subject_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border" scope="row">Статус</td>
            {subjectsList.map(subject => (
              <td
                key={subject.id}
                className={`border hover:bg-blue-100 cursor-pointer ${selectedData.selectedSubject === subject.id ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setSelectedData(prevData => ({
                  ...prevData,
                  selectedSubject: subject.id,
                }))}
              >
                {loadingStatuses ? (
                  "Загрузка..."
                ) : statusError ? (
                  statusError
                ) : (
                  statusDisplayMap[statusMap[subject.id]] || "Нет данных"
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Plan Tables */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th></th>
            <th>
              П1
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'P1',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedSubject?.subject_type === 'ЭПО' && (
              <th>
                ГП1
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GP1',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
            <th>
              П2
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'P2',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedSubject?.subject_type === 'ЭПО' && (
              <th>
                ГП2
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GP2',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
            <th>
              П3
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'P3',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedSubject?.subject_type === 'ЭПО' && (
              <th>
                ГП3
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GP3',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
            <th>
              Ф
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'F1',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedSubject?.subject_type === 'ЭПО' && (
              <th>
                Гф
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GF1',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              <td className="border">{time}</td>
              <td className="border">{hourPlan[index]?.P1 || '-'}</td>
              {selectedSubject?.subject_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P1_Gen || '-'}</td>}
              <td className="border">{hourPlan[index]?.P2 || '-'}</td>
              {selectedSubject?.subject_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P2_Gen || '-'}</td>}
              <td className="border">{hourPlan[index]?.P3 || '-'}</td>
              {selectedSubject?.subject_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P3_Gen || '-'}</td>}
              <td className="border">{hourPlan[index]?.F1 || '-'}</td>
              {selectedSubject?.subject_type === 'ЭПО' && <td className="border">{hourPlan[index]?.F1_Gen || '-'}</td>}
              {/* Repeat for other columns if necessary */}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default SubjectTable;

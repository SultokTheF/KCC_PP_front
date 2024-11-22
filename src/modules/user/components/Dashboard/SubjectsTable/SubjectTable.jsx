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

  // Asynchronous Function to Fetch Status
  const getPlanStatus = async (date, subject) => {
    try {
      const response = await axiosInstance.get(endpoints.GET_STATUS, {
        params: {
          date,
          subject: subject.id,
        },
      });
      return response.data || {};
    } catch (error) {
      console.error(`Error fetching status for subject ${subject.id}:`, error);
      return {};
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
          getPlanStatus(selectedDate, subject).then((statuses) => ({
            id: subject.id,
            statuses,
          }))
        );

        const statuses = await Promise.all(statusPromises);

        statuses.forEach(({ id, statuses }) => {
          newStatusMap[id] = statuses;
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

  // Function to generate status display components
  const generateStatusDisplayComponents = (statuses) => {
    if (!statuses || Object.keys(statuses).length === 0) {
      return "Нет данных";
    }

    const planKeys = ['P1_Status', 'P2_Status', 'P3_Status', 'F1_Status'];

    const planAbbreviations = {
      'P1_Status': 'П1',
      'P2_Status': 'П2',
      'P3_Status': 'П3',
      'F1_Status': 'Ф',
    };

    const statusColors = {
      'COMPLETED': 'text-green-500',
      'IN_PROGRESS': 'text-orange-500',
      'OUTDATED': 'text-red-500',
      'NOT_STARTED': 'text-black', // default color
    };

    return (
      <div>
        {planKeys.map(key => {
          const planStatus = statuses[key];
          const planName = planAbbreviations[key];
          const colorClass = statusColors[planStatus] || '';
          return (
            <span key={key} className={`${colorClass} mx-1`}>
              {planName}
            </span>
          );
        })}
      </div>
    );
  };

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
                  generateStatusDisplayComponents(statusMap[subject.id])
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
            </th>
            {selectedSubject?.subject_type === 'ЭПО' && (
              <th>
                ГП1
              </th>
            )}
            <th>
              П2
            </th>
            {selectedSubject?.subject_type === 'ЭПО' && (
              <th>
                ГП2
              </th>
            )}
            <th>
              П3
            </th>
            {selectedSubject?.subject_type === 'ЭПО' && (
              <th>
                ГП3
              </th>
            )}
            <th>
              Ф1
            </th>
            {selectedSubject?.subject_type === 'ЭПО' && (
              <th>
                ГФ1
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              <td className="border">{time}</td>
              <td className="border">{hourPlan[index]?.P1 || 0}</td>
              {selectedSubject?.subject_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P1_Gen || 0}</td>}
              <td className="border">{hourPlan[index]?.P2 || 0}</td>
              {selectedSubject?.subject_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P2_Gen || 0}</td>}
              <td className="border">{hourPlan[index]?.P3 || 0}</td>
              {selectedSubject?.subject_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P3_Gen || 0}</td>}
              <td className="border">{hourPlan[index]?.F1 || 0}</td>
              {selectedSubject?.subject_type === 'ЭПО' && <td className="border">{hourPlan[index]?.F1_Gen || 0}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default SubjectTable;

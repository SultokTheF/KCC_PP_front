// src/components/Dashboard/SubjectsTable/SubjectTable.jsx

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
  const selectedSubject = subjectsList.find(
    subject => subject.id === selectedData.selectedSubject
  );

  // Fetch data for the selected subject
  const { daysList, hoursList } = useDataFetching(
    selectedDate,
    selectedData.selectedSubject,
    'subject'
  );

  // Find the relevant dayPlan and sort hours by hour
  const dayPlan = daysList?.find(
    day =>
      day.subject === selectedSubject?.id &&
      day.date.split('T')[0] === selectedDate.split('T')[0]
  );
  const unsortedHourPlan = hoursList?.filter(hour => hour.day === dayPlan?.id) || [];
  const hourPlan = [...unsortedHourPlan].sort((a, b) => a.hour - b.hour);

  // Statuses
  const [statusMap, setStatusMap] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusError, setStatusError] = useState(null);

  const getPlanStatus = async (date, subject) => {
    try {
      const response = await axiosInstance.get(endpoints.GET_STATUS, {
        params: { date, subject: subject.id },
      });
      return response.data || {};
    } catch (error) {
      console.error(`Error fetching status for subject ${subject.id}:`, error);
      return {};
    }
  };

  useEffect(() => {
    const fetchAllStatuses = async () => {
      setLoadingStatuses(true);
      setStatusError(null);
      const newStatusMap = {};

      try {
        const statusPromises = subjectsList.map(subject =>
          getPlanStatus(selectedDate, subject).then(statuses => ({
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
        setStatusError('Ошибка при загрузке статусов.');
        console.error('Error fetching statuses:', error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    if (selectedDate && subjectsList.length > 0) {
      fetchAllStatuses();
    }
  }, [selectedDate, subjectsList]);

  const generateStatusDisplayComponents = (statuses) => {
    if (!statuses || Object.keys(statuses).length === 0) {
      return 'Нет данных';
    }
    const planKeys = [
      'P1_Status',
      'P1_Gen_Status',
      'P2_Status',
      'P2_Gen_Status',
      'P3_Status',
      'P3_Gen_Status',
      'F1_Status',
      'F1_Gen_Status',
    ];
    const planAbbreviations = {
      P1_Status: 'П1',
      P1__GenStatus: 'ГП1',
      P2_Status: 'П2',
      P2__GenStatus: 'ГП2',
      P3_Status: 'П3',
      P3__GenStatus: 'ГП3',
      F1_Status: 'Ф',
      F1__GenStatus: 'ГФ1',
    };
    const statusColors = {
      COMPLETED: 'text-green-500',
      IN_PROGRESS: 'text-orange-500',
      OUTDATED: 'text-red-500',
      NOT_STARTED: 'text-black',
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

  useEffect(() => {
    if (!selectedData.selectedSubject && subjectsList.length > 0) {
      setSelectedData(prevData => ({
        ...prevData,
        selectedSubject: subjectsList[0]?.id || 0,
      }));
    }
  }, [subjectsList, setSelectedData, selectedData.selectedSubject]);

  // Compute summary for each column (all numeric columns)
  const rowCount = hourPlan.length;
  const sumP1 = hourPlan.reduce((acc, row) => acc + (Number(row.P1) || 0), 0);
  const sumP1Gen = selectedSubject?.subject_type !== 'CONSUMER'
    ? hourPlan.reduce((acc, row) => acc + (Number(row.P1_Gen) || 0), 0)
    : null;
  const sumP2 = hourPlan.reduce((acc, row) => acc + (Number(row.P2) || 0), 0);
  const sumP2Gen = selectedSubject?.subject_type !== 'CONSUMER'
    ? hourPlan.reduce((acc, row) => acc + (Number(row.P2_Gen) || 0), 0)
    : null;
  const sumP3 = hourPlan.reduce((acc, row) => acc + (Number(row.P3) || 0), 0);
  const sumP3Gen = selectedSubject?.subject_type !== 'CONSUMER'
    ? hourPlan.reduce((acc, row) => acc + (Number(row.P3_Gen) || 0), 0)
    : null;
  const sumF1 = hourPlan.reduce((acc, row) => acc + (Number(row.F1) || 0), 0);
  const sumF1Gen = selectedSubject?.subject_type !== 'CONSUMER'
    ? hourPlan.reduce((acc, row) => acc + (Number(row.F1_Gen) || 0), 0)
    : null;

  const avgP1 = rowCount ? sumP1 / rowCount : 0;
  const avgP1Gen = selectedSubject?.subject_type !== 'CONSUMER' ? (rowCount ? sumP1Gen / rowCount : 0) : null;
  const avgP2 = rowCount ? sumP2 / rowCount : 0;
  const avgP2Gen = selectedSubject?.subject_type !== 'CONSUMER' ? (rowCount ? sumP2Gen / rowCount : 0) : null;
  const avgP3 = rowCount ? sumP3 / rowCount : 0;
  const avgP3Gen = selectedSubject?.subject_type !== 'CONSUMER' ? (rowCount ? sumP3Gen / rowCount : 0) : null;
  const avgF1 = rowCount ? sumF1 / rowCount : 0;
  const avgF1Gen = selectedSubject?.subject_type !== 'CONSUMER' ? (rowCount ? sumF1Gen / rowCount : 0) : null;

  return (
    <>
      {/* Status Table */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th>Субъект</th>
            {subjectsList.map(subject => (
              <th key={subject.id}>{subject.subject_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border" scope="row">
              Статус
            </td>
            {subjectsList.map(subject => (
              <td
                key={subject.id}
                className="border hover:bg-blue-100 cursor-pointer"
                onClick={() =>
                  setSelectedData(prevData => ({
                    ...prevData,
                    selectedSubject: subject.id,
                  }))
                }
              >
                {loadingStatuses
                  ? 'Загрузка...'
                  : statusError
                  ? statusError
                  : generateStatusDisplayComponents(statusMap[subject.id])}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Plan Table */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th></th>
            <th>П1</th>
            {selectedSubject?.subject_type !== 'CONSUMER' && <th>ГП1</th>}
            <th>П2</th>
            {selectedSubject?.subject_type !== 'CONSUMER' && <th>ГП2</th>}
            <th>П3</th>
            {selectedSubject?.subject_type !== 'CONSUMER' && <th>ГП3</th>}
            <th>Ф1</th>
            {selectedSubject?.subject_type !== 'CONSUMER' && <th>ГФ1</th>}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              <td className="border">{time}</td>
              <td className="border">{hourPlan[index]?.P1 || 0}</td>
              {selectedSubject?.subject_type !== 'CONSUMER' && (
                <td className="border">{hourPlan[index]?.P1_Gen || 0}</td>
              )}
              <td className="border">{hourPlan[index]?.P2 || 0}</td>
              {selectedSubject?.subject_type !== 'CONSUMER' && (
                <td className="border">{hourPlan[index]?.P2_Gen || 0}</td>
              )}
              <td className="border">{hourPlan[index]?.P3 || 0}</td>
              {selectedSubject?.subject_type !== 'CONSUMER' && (
                <td className="border">{hourPlan[index]?.P3_Gen || 0}</td>
              )}
              <td className="border">{hourPlan[index]?.F1 || 0}</td>
              {selectedSubject?.subject_type !== 'CONSUMER' && (
                <td className="border">{hourPlan[index]?.F1_Gen || 0}</td>
              )}
            </tr>
          ))}
          {/* Summary Row: Sum */}
          <tr>
            <td className="border font-bold">Сумма</td>
            <td className="border">{sumP1}</td>
            {selectedSubject?.subject_type !== 'CONSUMER' && <td className="border">{sumP1Gen}</td>}
            <td className="border">{sumP2.toFixed(2)}</td>
            {selectedSubject?.subject_type !== 'CONSUMER' && <td className="border">{sumP2Gen.toFixed(2)}</td>}
            <td className="border">{sumP3}</td>
            {selectedSubject?.subject_type !== 'CONSUMER' && <td className="border">{sumP3Gen}</td>}
            <td className="border">{sumF1}</td>
            {selectedSubject?.subject_type !== 'CONSUMER' && <td className="border">{sumF1Gen}</td>}
          </tr>
          {/* Summary Row: Average */}
          <tr>
            <td className="border font-bold">Среднее</td>
            <td className="border">{avgP1.toFixed(2)}</td>
            {selectedSubject?.subject_type !== 'CONSUMER' && <td className="border">{avgP1Gen.toFixed(2)}</td>}
            <td className="border">{avgP2.toFixed(2)}</td>
            {selectedSubject?.subject_type !== 'CONSUMER' && <td className="border">{avgP2Gen.toFixed(2)}</td>}
            <td className="border">{avgP3.toFixed(2)}</td>
            {selectedSubject?.subject_type !== 'CONSUMER' && <td className="border">{avgP3Gen.toFixed(2)}</td>}
            <td className="border">{avgF1.toFixed(2)}</td>
            {selectedSubject?.subject_type !== 'CONSUMER' && <td className="border">{avgF1Gen.toFixed(2)}</td>}
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default SubjectTable;

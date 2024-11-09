// src/components/Dashboard/SubjectsTable/SubjectTable.js
import React, { useState, useEffect } from 'react';
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

  const getStatus = (subject) => {
    const day = daysList?.find(day => day.subject === subject.id && day.date.split('T')[0] === selectedDate.split('T')[0]);

    switch (day?.status) {
      case 'PRIMARY_PLAN':
        return '-П1-';
      case 'KCCPP_PLAN':
        return '-П1-П2-';
      case 'KEGOS_PLAN':
        return '-П1-П2-П3-';
      case 'FACT1':
      case 'FACT2':
      case 'COMPLETED':
        return '-П1-П2-П3-Ф-';
      default:
        return '-';
    }
  };

  useEffect(() => {
    if (!selectedData.selectedSubject && subjectsList.length > 0) {
      setSelectedData(prevData => ({
        ...prevData,
        selectedSubject: subjectsList[0]?.id || 0,
      }));
    }
  }, [subjectsList]);

  return (
    <>
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
                {getStatus(subject)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th></th>
            <th>П1</th>
            {selectedSubject?.subject_type === 'ЭПО' && <th>ГП1</th>}
            <th>П2</th>
            {selectedSubject?.subject_type === 'ЭПО' && <th>ГП2</th>}
            <th>П3</th>
            {selectedSubject?.subject_type === 'ЭПО' && <th>ГП3</th>}
            <th>Ф</th>
            {selectedSubject?.subject_type === 'ЭПО' && <th>ГФ</th>}
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
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default SubjectTable;

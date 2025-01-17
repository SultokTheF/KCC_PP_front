// src/components/Dashboard/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { axiosInstance, endpoints } from '../../../../services/apiConfig';
import * as XLSX from 'xlsx'; // Import the XLSX library

import Sidebar from '../Sidebar/Sidebar';
import Calendar from '../Calendar/Calendar';
import SubjectTable from './SubjectsTable/SubjectTable';
import ObjectTable from './SubjectsTable/ObjectsTable';

const Dashboard = () => {
  const { user } = useAuth();

  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [holidaysList, setHolidaysList] = useState([]);

  const [selectedDate, setSelectedDate] = useState(() => {
    // Initialize selectedDate from localStorage or default to today
    return localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
  });

  const [selectedData, setSelectedData] = useState({
    selectedSubject: 0,
    selectedObject: 0,
  });

  const fetchData = async () => {
    try {
      const [subjectsResponse, objectsResponse, holidaysResponse] = await Promise.all([
        axiosInstance.get(endpoints.SUBJECTS),
        axiosInstance.get(endpoints.OBJECTS),
        axiosInstance.get(endpoints.HOLIDAYS),
      ]);

      const filteredSubjects = subjectsResponse.data.filter(subject => subject.users.includes(user.id));
      setSubjectsList(filteredSubjects);

      const filteredObjects = objectsResponse.data.filter(object => object.users.includes(user.id));
      setObjectsList(filteredObjects);

      setHolidaysList(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Full Export Function
  const handleFullExport = async () => {
    try {
      const timeIntervals = [
        '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
        '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
        '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
        '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00',
      ];

      const isFullExport = ['admin', 'dispatcher'].includes(user.role); // Check user role

      // Prepare combined data
      const combinedData = [];

      for (const subject of subjectsList) {
        // Fetch subject hours
        const response = await axiosInstance.get(endpoints.HOURS, {
          params: { day: selectedDate, sub: subject.id },
        });
        const subjectHours = response.data || [];

        // Prepare subject table headers
        const subjectTableHeaders = [
          'Time',
          'P1',
          ...(subject?.subject_type === 'ЭПО' ? ['P1_Gen'] : []),
          'P2',
          ...(subject?.subject_type === 'ЭПО' ? ['P2_Gen'] : []),
          'P3',
          ...(subject?.subject_type === 'ЭПО' ? ['P3_Gen'] : []),
          'F1',
          ...(subject?.subject_type === 'ЭПО' ? ['F1_Gen'] : []),
          'F2',
          ...(subject?.subject_type === 'ЭПО' ? ['F2_Gen'] : []),
          ...(isFullExport ? ['Coefficient', 'Volume'] : []), // Include columns based on role
          'P2_Message',
        ];

        // Prepare subject table data
        const subjectTableData = [
          subjectTableHeaders,
          ...timeIntervals.map((time, index) => {
            const hourData = subjectHours.find((hour) => hour.hour === index + 1) || {};
            return [
              time,
              hourData.P1 || 0,
              ...(subject?.subject_type === 'ЭПО' ? [hourData.P1_Gen || 0] : []),
              hourData.P2 || 0,
              ...(subject?.subject_type === 'ЭПО' ? [hourData.P2_Gen || 0] : []),
              hourData.P3 || 0,
              ...(subject?.subject_type === 'ЭПО' ? [hourData.P3_Gen || 0] : []),
              hourData.F1 || 0,
              ...(subject?.subject_type === 'ЭПО' ? [hourData.F1_Gen || 0] : []),
              hourData.F2 || 0,
              ...(subject?.subject_type === 'ЭПО' ? [hourData.F2_Gen || 0] : []),
              ...(isFullExport ? [hourData.coefficient || 1, hourData.volume || 0] : []), // Include values based on role
              hourData.P2_message || '',
            ];
          }),
        ];

        combinedData.push(['Subject:', subject.subject_name]);
        combinedData.push([]);
        combinedData.push(['Subject Table']);
        combinedData.push(...subjectTableData);
        combinedData.push([]);

        // Fetch objects for this subject
        const objectsForSubject = objectsList.filter(
          (object) => object.subject === subject.id
        );

        for (const object of objectsForSubject) {
          // Fetch object hours
          const response = await axiosInstance.get(endpoints.HOURS, {
            params: { day: selectedDate, obj: object.id },
          });
          const objectHours = response.data || [];

          const objectTableHeaders = [
            'Time',
            'P1',
            ...(object?.object_type === 'ЭПО' ? ['P1_Gen'] : []),
            'P2',
            ...(object?.object_type === 'ЭПО' ? ['P2_Gen'] : []),
            'P3',
            ...(object?.object_type === 'ЭПО' ? ['P3_Gen'] : []),
            'F1',
            ...(object?.object_type === 'ЭПО' ? ['F1_Gen'] : []),
            'F2',
            ...(object?.object_type === 'ЭПО' ? ['F2_Gen'] : []),
            ...(isFullExport ? ['Coefficient', 'Volume'] : []), // Include columns based on role
            'P2_Message',
          ];

          const objectTableData = [
            objectTableHeaders,
            ...timeIntervals.map((time, index) => {
              const hourData = objectHours.find((hour) => hour.hour === index + 1) || {};
              return [
                time,
                hourData.P1 || 0,
                ...(object?.object_type === 'ЭПО' ? [hourData.P1_Gen || 0] : []),
                hourData.P2 || 0,
                ...(object?.object_type === 'ЭПО' ? [hourData.P2_Gen || 0] : []),
                hourData.P3 || 0,
                ...(object?.object_type === 'ЭПО' ? [hourData.P3_Gen || 0] : []),
                hourData.F1 || 0,
                ...(object?.object_type === 'ЭПО' ? [hourData.F1_Gen || 0] : []),
                hourData.F2 || 0,
                ...(object?.object_type === 'ЭПО' ? [hourData.F2_Gen || 0] : []),
                ...(isFullExport ? [hourData.coefficient || 1, hourData.volume || 0] : []), // Include values based on role
                hourData.P2_message || '',
              ];
            }),
          ];

          combinedData.push(['Object:', object.object_name]);
          combinedData.push([]);
          combinedData.push(...objectTableData);
          combinedData.push([]);
        }
      }

      // Generate Excel file
      const worksheet = XLSX.utils.aoa_to_sheet(combinedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Full Export');
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      // Save file
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `full_export_${selectedDate}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error during full export:', error);
    }
  };

  return (
    <div className="w-screen">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Calendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            holidays={holidaysList}
          />
          {/* Export Button */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              onClick={handleFullExport}
            >
              Экспорт полного отчета
            </button>
          </div>
          <div className="flex">
            <div className="flex-1 m-2">
              <SubjectTable
                selectedData={selectedData}
                setSelectedData={setSelectedData}
                subjectsList={subjectsList}
                selectedDate={selectedDate}
              />
            </div>
            <div className="flex-1 m-2">
              <ObjectTable
                selectedData={selectedData}
                setSelectedData={setSelectedData}
                objectsList={objectsList}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

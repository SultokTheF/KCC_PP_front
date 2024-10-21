// CombinedTable.js
import React from 'react';
import { FaFileExport } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const CombinedTable = ({ combinedData }) => {
  if (!combinedData || combinedData.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Общая Таблица</h2>
        <div>Нет данных для отображения.</div>
      </div>
    );
  }

  // Extract unique operation names to dynamically create columns
  const operationNames = [...new Set(combinedData.map(row => row.operationName))];

  // Function to export the combined table to Excel
  const exportCombinedToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    // Define the header
    const header = [
      'Дата',
      'Час',
      'Субъект',
      ...operationNames.map(op => `Значение Субъекта (${op})`),
      'Объект',
      ...operationNames.map(op => `Значение Объекта (${op})`)
    ];
    wsData.push(header);

    // Organize data by date, hour, subject, and object
    const groupedData = combinedData.reduce((acc, row) => {
      const key = `${row.date}-${row.hour}-${row.subjectName}-${row.objectName}`;
      if (!acc[key]) {
        acc[key] = {
          date: row.date,
          hour: row.hour,
          subjectName: row.subjectName,
          objectName: row.objectName,
          subjectValues: {},
          objectValues: {},
        };
      }
      acc[key].subjectValues[row.operationName] = row.subjectValue;
      acc[key].objectValues[row.operationName] = row.objectValue;
      return acc;
    }, {});

    // Populate the rows
    Object.values(groupedData).forEach(entry => {
      const row = [
        entry.date,
        entry.hour,
        entry.subjectName,
        ...operationNames.map(op => entry.subjectValues[op] !== undefined ? entry.subjectValues[op] : '-'),
        entry.objectName,
        ...operationNames.map(op => entry.objectValues[op] !== undefined ? entry.objectValues[op] : '-'),
      ];
      wsData.push(row);
    });

    // Create worksheet and append to workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Combined Table');

    // Save the file
    XLSX.writeFile(wb, 'combined_table.xlsx');
  };

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Общая Таблица</h2>
        <button
          onClick={exportCombinedToExcel}
          className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center space-x-1"
        >
          <FaFileExport className="mr-1" />
          <span>Экспортировать</span>
        </button>
      </div>
      <div className="overflow-x-auto max-w-full mb-6">
        <table className="min-w-full bg-white border border-gray-200 shadow-md table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">Дата</th>
              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">Час</th>
              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">Субъект</th>
              {operationNames.map(op => (
                <th key={`subject-op-${op}`} className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                  Значение Субъекта ({op})
                </th>
              ))}
              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">Объект</th>
              {operationNames.map(op => (
                <th key={`object-op-${op}`} className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                  Значение Объекта ({op})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.values(
              combinedData.reduce((acc, row) => {
                const key = `${row.date}-${row.hour}-${row.subjectName}-${row.objectName}`;
                if (!acc[key]) {
                  acc[key] = {
                    date: row.date,
                    hour: row.hour,
                    subjectName: row.subjectName,
                    objectName: row.objectName,
                    subjectValues: {},
                    objectValues: {},
                  };
                }
                acc[key].subjectValues[row.operationName] = row.subjectValue;
                acc[key].objectValues[row.operationName] = row.objectValue;
                return acc;
              }, {})
            ).map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-2 py-1 text-gray-600">{entry.date}</td>
                <td className="border px-2 py-1 text-gray-600">{entry.hour}</td>
                <td className="border px-2 py-1 text-gray-600">{entry.subjectName}</td>
                {operationNames.map(op => (
                  <td key={`subject-${op}-${index}`} className="border px-2 py-1 text-gray-600">
                    {entry.subjectValues[op] !== undefined ? entry.subjectValues[op] : '-'}
                  </td>
                ))}
                <td className="border px-2 py-1 text-gray-600">{entry.objectName}</td>
                {operationNames.map(op => (
                  <td key={`object-${op}-${index}`} className="border px-2 py-1 text-gray-600">
                    {entry.objectValues[op] !== undefined ? entry.objectValues[op] : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CombinedTable;

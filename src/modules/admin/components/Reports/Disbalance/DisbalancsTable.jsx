import React from 'react';
import * as XLSX from 'xlsx';

// Import timeIntervals if it's in a separate module
const timeIntervals = [
  '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
  '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
  '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
  '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00',
];

const DisbalanceTable = ({
  formData,
  subjectsList,
  hoursList,
}) => {
  if (!hoursList || hoursList.length === 0) {
    return <div>No data available</div>;
  }

  // Group hoursList by date
  const groupedData = {};
  hoursList.forEach((hourData) => {
    const date = hourData.date || 'Unknown Date';
    if (!groupedData[date]) {
      groupedData[date] = [];
    }
    groupedData[date].push(hourData);
  });

  // Function to handle export to Excel
  const exportToExcel = () => {
    const subject = subjectsList?.find((subject) => subject.id === formData.subject);

    const data = [];

    Object.keys(groupedData).forEach((date) => {
      const hours = groupedData[date];
      hours.forEach((hourData, index) => {
        const hourIndex = index % 24;
        const rowData = {
          Date: date,
          Time: hourData.time || timeIntervals[hourIndex],
          Plan: hourData[formData.planMode],
          ...(subject?.subject_type === "ЭПО" && { "Plan Generation": hourData[formData.planModeGen] }),
          Fact: hourData[formData.factMode],
          ...(subject?.subject_type === "ЭПО" && { "Fact Generation": hourData[formData.factModeGen] }),
          "BE Up": hourData.BE_Up,
          "BE Down": hourData.BE_Down,
          "OD Up": hourData.OD_Up,
          "OD Down": hourData.OD_Down,
        };
        data.push(rowData);
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Disbalance");
    XLSX.writeFile(workbook, 'Disbalance.xlsx');
  };

  return (
    <div>
      {/* Export to Excel Button */}
      <button
        onClick={exportToExcel}
        className="bg-green-500 text-white font-medium py-2 px-4 rounded hover:bg-green-700 mb-4"
      >
        Экспорт в Excel
      </button>

      {/* Disbalance Table */}
      <table className="min-w-full text-sm text-center border border-gray-200">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4">Дата</th>
            <th className="border border-gray-300 px-4">Время</th>
            <th className="border border-gray-300 px-4">План</th>
            {subjectsList?.find((subject) => subject.id === formData.subject)?.subject_type === "ЭПО" && (
              <th className="border border-gray-300 px-4">План Генерации</th>
            )}
            <th className="border border-gray-300 px-4">Факт</th>
            {subjectsList?.find((subject) => subject.id === formData.subject)?.subject_type === "ЭПО" && (
              <th className="border border-gray-300 px-4">Факт Генерации</th>
            )}
            <th className="border border-gray-300 px-4">BE ⬆️ (20%)</th>
            <th className="border border-gray-300 px-4">BE ⬇️ (20%)</th>
            <th className="border border-gray-300 px-4">OD ⬆️ (20%)</th>
            <th className="border border-gray-300 px-4">OD ⬇️ (20%)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Object.keys(groupedData).map((date) => {
            const hours = groupedData[date];
            return hours.map((hourData, index) => {
              const hourIndex = index % 24;
              const key = `${date}-${hourIndex}`;

              return (
                <tr
                  key={key}
                  className={hourIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {hourIndex === 0 && (
                    <td className="border border-gray-300 px-4" rowSpan={24}>{date}</td>
                  )}
                  <td className="border border-gray-300 px-4">{hourData.time}</td>
                  <td className="border border-gray-300 px-4">{hourData[formData.planMode]}</td>
                  {subjectsList?.find((subject) => subject.id === formData.subject)?.subject_type === "ЭПО" && (
                    <td className="border border-gray-300 px-4">{hourData[formData.planModeGen]}</td>
                  )}
                  <td className="border border-gray-300 px-4">{hourData[formData.factMode]}</td>
                  {subjectsList?.find((subject) => subject.id === formData.subject)?.subject_type === "ЭПО" && (
                    <td className="border border-gray-300 px-4">{hourData[formData.factModeGen]}</td>
                  )}
                  <td className={`border border-gray-300 ${hourData.BE_Up === 0 ? "" : "bg-blue-500 text-white"} px-4`}>{hourData.BE_Up}</td>
                  <td className={`border border-gray-300 ${hourData.BE_Down === 0 ? "" : "bg-blue-500 text-white"} px-4`}>{hourData.BE_Down}</td>
                  <td className={`border border-gray-300 ${hourData.OD_Up === 0 ? "" : "bg-blue-500 text-white"} px-4`}>{hourData.OD_Up}</td>
                  <td className={`border border-gray-300 ${hourData.OD_Down === 0 ? "" : "bg-blue-500 text-white"} px-4`}>{hourData.OD_Down}</td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DisbalanceTable;

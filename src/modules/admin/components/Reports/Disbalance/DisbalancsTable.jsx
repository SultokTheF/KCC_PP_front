import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const DisbalanceTable = ({ formData, subjectsList, daysList, hoursList, setFormData }) => {
  const [plansData, setPlansData] = useState([]);

  const subject = subjectsList?.find((subject) => subject.id === formData.subject);

  useEffect(() => {
    const fetchPlansForDates = () => {
      const plans = formData.dateArray.map(date => {
        const dayPlan = daysList.find((day) => day.subject === formData.subject && day.date.split('T')[0] === date);
        const hours = hoursList.filter((hour) => hour.day === dayPlan?.id);

        if (hours.length > 0) {
          return hours.map(hour => ({
            time: hour.time,
            plan: hour[formData.planMode],
            planGen: hour[formData.planModeGen],
            fact: hour[formData.factMode],
            factGen: hour[formData.factModeGen],
            BE_Up: hour.BE_Up,
            BE_Down: hour.BE_Down,
            OD_Up: hour.OD_Up,
            OD_Down: hour.OD_Down,
          }));
        } else {
          return Array(24).fill({
            time: '',
            plan: 0,
            planGen: 0,
            fact: 0,
            factGen: 0,
            BE_Up: 0,
            BE_Down: 0,
            OD_Up: 0,
            OD_Down: 0,
          });
        }
      });

      setPlansData(plans);
    };

    fetchPlansForDates();
  }, [formData.subject, formData.planMode, formData.factMode, formData.dateArray, formData.planModeGen, formData.factModeGen, daysList, hoursList]);

  useEffect(() => {
    if (plansData.length > 0) {
      const combinedPlans = plansData.flat();
      setFormData((prev) => ({
        ...prev,
        plan: combinedPlans.map((hour) => hour.plan),
        fact: combinedPlans.map((hour) => hour.fact),
      }));
    }
  }, [plansData, setFormData]);

  const timeIntervals = [
    '00 - 01',
    '01 - 02',
    '02 - 03',
    '03 - 04',
    '04 - 05',
    '05 - 06',
    '06 - 07',
    '07 - 08',
    '08 - 09',
    '09 - 10',
    '10 - 11',
    '11 - 12',
    '12 - 13',
    '13 - 14',
    '14 - 15',
    '15 - 16',
    '16 - 17',
    '17 - 18',
    '18 - 19',
    '19 - 20',
    '20 - 21',
    '21 - 22',
    '22 - 23',
    '23 - 00'
  ];

  const exportToExcel = () => {
    // Prepare the data for the XLSX file
    const data = formData.dateArray.flatMap((date, dateIndex) =>
      plansData[dateIndex].map((hour, hourIndex) => ({
        Date: date,
        Time: timeIntervals[hourIndex],
        Plan: hour.plan,
        ...(subject?.subject_type === "ЭПО" && { "Plan Generation": hour.planGen }),
        Fact: hour.fact,
        ...(subject?.subject_type === "ЭПО" && { "Fact Generation": hour.factGen }),
        "BE Up": hour.BE_Up,
        "BE Down": hour.BE_Down,
        "OD Up": hour.OD_Up,
        "OD Down": hour.OD_Down,
      }))
    );

    // Create a worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Disbalance");

    // Write the workbook and trigger the download
    XLSX.writeFile(workbook, 'Disbalance.xlsx');
  };

  if (!formData.dateArray || !plansData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <button
        onClick={exportToExcel}
        className="bg-green-500 text-white font-medium py-2 px-4 rounded hover:bg-green-700 mb-4"
      >
        Экспорт в Excel
      </button>
      <table className="table-auto h-3 text-xs text-center w-full border-collapse border border-gray-400">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4">Дата</th>
            <th className="border border-gray-300 px-4">Время</th>
            <th className="border border-gray-300 px-4">План</th>
            {subject?.subject_type === "ЭПО" && (
              <th className="border border-gray-300 px-4">План Генерации</th>
            )}
            <th className="border border-gray-300 px-4">Факт</th>
            {subject?.subject_type === "ЭПО" && (
              <th className="border border-gray-300 px-4">Факт Генерации</th>
            )}
            <th className="border border-gray-300 px-4">BE ⬆️ (20%)</th>
            <th className="border border-gray-300 px-4">BE ⬇️ (20%)</th>
            <th className="border border-gray-300 px-4">OD ⬆️ (20%)</th>
            <th className="border border-gray-300 px-4">OD ⬇️ (20%)</th>
          </tr>
        </thead>
        <tbody>
          {formData.dateArray.map((date, dateIndex) => (
            (plansData[dateIndex] || []).map((hour, hourIndex) => (
              <tr key={`${date}-${hourIndex}`}>
                {hourIndex === 0 && (
                  <td className="border border-gray-300 px-4" rowSpan={24}>{date}</td>
                )}
                <td className="border border-gray-300 px-4">{timeIntervals[hourIndex]}</td>
                <td className="border border-gray-300 px-4">{hour.plan}</td>
                {subject?.subject_type === "ЭПО" && (
                  <td className="border border-gray-300 px-4">{hour.planGen}</td>
                )}
                <td className="border border-gray-300 px-4">{hour.fact}</td>
                {subject?.subject_type === "ЭПО" && (
                  <td className="border border-gray-300 px-4">{hour.factGen}</td>
                )}
                <td className={`border border-gray-300 ${hour.BE_Up === 0 ? "" : "bg-blue-500 text-white"} px-4`}>{hour.BE_Up}</td>
                <td className={`border border-gray-300 ${hour.BE_Down === 0 ? "" : "bg-blue-500 text-white"} px-4`}>{hour.BE_Down}</td>
                <td className={`border border-gray-300 ${hour.OD_Up === 0 ? "" : "bg-blue-500 text-white"} px-4`}>{hour.OD_Up}</td>
                <td className={`border border-gray-300 ${hour.OD_Down === 0 ? "" : "bg-blue-500 text-white"} px-4`}>{hour.OD_Down}</td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DisbalanceTable;

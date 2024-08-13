import React, { useState, useEffect } from 'react';

const PredictionTariffsTable = ({ selectedMonth, data, setData }) => {
  const [editingCell, setEditingCell] = useState({ day: null, hour: null });
  const [inputValue, setInputValue] = useState('');

  const numberOfDays = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
  const numberOfHours = 24;

  useEffect(() => {
    const newTableData = {};

    data.days.forEach(day => {
      const dayDate = new Date(day.date);
      const dayDateString = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      if (!newTableData[dayDateString]) {
        newTableData[dayDateString] = Array(numberOfHours).fill(0);
      }
      data.hours
        .filter(hour => hour.day === day.id)
        .forEach(hour => {
          newTableData[dayDateString][hour.hour - 1] = parseFloat(hour[data.tariffType]) || 0;
        });
    });

    setData(prevData => ({
      ...prevData,
      tableData: Object.entries(newTableData).map(([key, value]) => ({ [key]: value })),
    }));
  }, [data.days, data.hours, data.tariffType, selectedMonth]);

  const handleDoubleClick = (day, hour) => {
    setEditingCell({ day, hour });
    const existingValue = data.tableData.find(d => Object.keys(d)[0] === day)?.[day]?.[hour] || 0;
    setInputValue(existingValue);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    setData(prevData => {
      const newTableData = [...prevData.tableData];
      const dayData = newTableData.find(d => Object.keys(d)[0] === editingCell.day);
      if (dayData) {
        dayData[editingCell.day][editingCell.hour] = parseFloat(inputValue);
      } else {
        const newDayData = Array(numberOfHours).fill(0);
        newDayData[editingCell.hour] = parseFloat(inputValue);
        newTableData.push({ [editingCell.day]: newDayData });
      }

      return {
        ...prevData,
        tableData: newTableData,
      };
    });
    setEditingCell({ day: null, hour: null });
  };

  return (
    <div className="overflow-x-auto mt-5">
      <div className="w-full">
        <table className="w-full min-w-full text-center text-sm bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 w-20 border-b">День</th>
              {Array.from({ length: numberOfHours }, (_, i) => i + 1).map((hour) => (
                <th key={hour} className="px-4 w-12 border-b">{hour}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.tableData.map((dayData, index) => {
              const day = Object.keys(dayData)[0];
              return (
                <tr key={day} className="bg-white hover:bg-gray-100">
                  <td className="px-4 w-20 border-b">{day.split('-').reverse().join('.')}</td>
                  {dayData[day].map((hourData, hourIndex) => (
                    <td
                      key={hourIndex}
                      className={`px-4 w-12 border text-center hover:bg-blue-100 ${editingCell.day === day && editingCell.hour === hourIndex ? 'bg-blue-100' : ''}`}
                      onDoubleClick={() => handleDoubleClick(day, hourIndex)}
                    >
                      {editingCell.day === day && editingCell.hour === hourIndex ? (
                        <input
                          type="text"
                          value={inputValue}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          autoFocus
                          className="w-12 h-full text-center"
                        />
                      ) : (
                        hourData
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PredictionTariffsTable;

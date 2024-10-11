// DirectionsTable.js
import React, { useState } from 'react';

// Tailwind CSS spinner component
const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="w-12 h-12 border-4 border-blue-500 border-solid border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const DirectionsTable = ({ data, setData, loading }) => {
  const [editingCell, setEditingCell] = useState({ day: null, hour: null });

  const numberOfHours = 24;

  const toggleCellValue = (day, hour) => {
    setData((prevData) => {
      const newTableData = [...prevData.tableData];
      const dayData = newTableData.find(d => Object.keys(d)[0] === day);

      if (dayData) {
        const currentValue = dayData[day][hour - 1];
        dayData[day][hour - 1] = currentValue === 'UP' ? 'DOWN' : 'UP';
      }

      return {
        ...prevData,
        tableData: newTableData,
      };
    });

    // Clear the editing cell state after toggling
    setEditingCell({ day: null, hour: null });
  };

  const handleDoubleClick = (day, hour) => {
    setEditingCell({ day, hour }); // Set the cell as being edited
    toggleCellValue(day, hour); // Toggle the cell value
  };

  // Render the spinner if data is still being fetched
  if (loading) {
    return <Spinner />;
  }

  // Render the table after loading is complete
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
            {data.tableData.map((dayData) => {
              const day = Object.keys(dayData)[0];
              return (
                <tr key={day} className="bg-white hover:bg-gray-100">
                  <td className="px-4 w-20 border-b">{day.split('-').reverse().join('.')}</td>
                  {dayData[day].map((hourData, hourIndex) => (
                    <td
                      key={hourIndex}
                      className={`px-4 w-12 border text-center hover:bg-blue-100 ${
                        hourData === 'DOWN' ? 'bg-green-100' : hourData === 'UP' ? 'bg-red-100' : ''
                      } ${
                        editingCell.day === day && editingCell.hour === hourIndex + 1
                          ? 'bg-blue-100'
                          : ''
                      }`}
                      onDoubleClick={() => handleDoubleClick(day, hourIndex + 1)}
                    >
                      {hourData === 'UP' ? '↑' : hourData === 'DOWN' ? '↓' : hourData === 'NONE' ? '—' : ''}
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

export default DirectionsTable;

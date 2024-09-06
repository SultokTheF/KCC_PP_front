import React, { useState } from "react";

// Tailwind CSS spinner component
const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="w-12 h-12 border-4 border-blue-500 border-solid border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const VolumesTable = ({ data, setData, loading }) => {
  const [editingCell, setEditingCell] = useState({ day: null, hour: null });
  const [inputValue, setInputValue] = useState("");

  const numberOfHours = 24;

  const handleDoubleClick = (day, hour) => {
    setEditingCell({ day, hour });

    // Find the current value in the cell
    const existingValue = data.tableData.find((d) => Object.keys(d)[0] === day)?.[day]?.[hour] || 0;
    setInputValue(existingValue); // Set input value with the existing cell value
  };

  const handleChange = (e) => {
    setInputValue(e.target.value); // Update inputValue state on input change
  };

  const handleBlur = () => {
    setData((prevData) => {
      const newTableData = [...prevData.tableData];
      const dayData = newTableData.find((d) => Object.keys(d)[0] === editingCell.day);

      if (dayData) {
        // Update the specific cell with the new input value
        dayData[editingCell.day][editingCell.hour] = parseFloat(inputValue);
      }

      return {
        ...prevData,
        tableData: newTableData,
      };
    });

    // Clear the editing cell state after update
    setEditingCell({ day: null, hour: null });
  };

  // Render the spinner if data is still being fetched
  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="overflow-x-auto mt-5">
      <div className="w-full">
        <table className="w-full min-w-full text-center text-sm bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 w-20 border-b">День</th>
              {Array.from({ length: numberOfHours }, (_, i) => i + 1).map((hour) => (
                <th key={hour} className="px-4 w-12 border-b">
                  {hour}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.tableData.map((dayData, index) => {
              const day = Object.keys(dayData)[0];
              return (
                <tr key={day} className="bg-white hover:bg-gray-100">
                  <td className="px-4 w-20 border-b">{day.split("-").reverse().join(".")}</td>
                  {dayData[day].map((hourData, hourIndex) => (
                    <td
                      key={hourIndex}
                      className={`px-4 w-12 border text-center hover:bg-blue-100 ${
                        editingCell.day === day && editingCell.hour === hourIndex ? "bg-blue-100" : ""
                      }`}
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

export default VolumesTable;

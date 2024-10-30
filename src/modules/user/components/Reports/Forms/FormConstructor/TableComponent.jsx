// TableComponent.jsx

import React, { useState } from 'react';
import { FaTrashAlt, FaPlusCircle, FaCheckCircle } from 'react-icons/fa';
import { getRowName } from './utils';
import { Circles } from 'react-loader-spinner'; // Import loader

const TableComponent = ({
  table,
  tableIndex,
  subjectList,
  updateColumnName,
  visibleSubTables,
  setVisibleSubTables,
  allObjects,
  exportToExcel,
}) => {
  // State to track expanded cells in the main table
  const [expandedCells, setExpandedCells] = useState({});

  // State to track expanded cells in the sub-tables
  const [expandedSubTableCells, setExpandedSubTableCells] = useState({});

  // Function to check if a sub-table for a subject is visible
  const isSubTableVisible = (uniqueKey) => {
    return visibleSubTables[uniqueKey];
  };

  // Toggle visibility for each subject's sub-table
  const toggleSubTableVisibility = (uniqueKey) => {
    setVisibleSubTables((prev) => ({
      ...prev,
      [uniqueKey]: !prev[uniqueKey],
    }));
  };

  // Toggle expanded state for a specific cell in the main table
  const toggleExpanded = (tableIdx, rowIdx, colIdx) => {
    const key = `${tableIdx}-${rowIdx}-${colIdx}`;
    setExpandedCells((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle expanded state for a specific cell in the sub-tables
  const toggleSubTableCellExpanded = (uniqueKey, date, resName) => {
    const key = `${uniqueKey}-${date}-${resName}`;
    setExpandedSubTableCells((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="mb-10">
      {/* Table Name Display */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-1">Название таблицы: {table.name}</label>
      </div>

      {/* Main Table Structure */}
      <h2 className="text-lg font-semibold mb-4">Основная таблица</h2>
      <div className="overflow-x-auto max-w-full mb-6">
        <table className="min-w-full bg-white border border-gray-200 shadow-md table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                Субъекты
              </th>
              {table.tableConfig.length > 0 &&
                table.tableConfig[0].data.map((res, index) => (
                  <th
                    key={res.id}
                    className="px-2 py-1 text-left text-gray-700 font-semibold border-b"
                  >
                    <input
                      type="text"
                      value={res.name}
                      onChange={(e) =>
                        updateColumnName(tableIndex, index, e.target.value)
                      }
                      className="border border-gray-300 rounded-md p-1 focus:ring-2 focus:ring-blue-500"
                      style={{ width: "100px" }}
                    />
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {table.tableConfig.map((item, rowIndex) => (
              <React.Fragment key={`${tableIndex}-${rowIndex}`}>
                <tr className="hover:bg-gray-50">
                  <td className="border px-2 py-1 text-gray-600">
                    {getRowName(subjectList, allObjects, item.subject, item.objects)}
                  </td>
                  {item.data.map((res, colIndex) => (
                    <td
                      key={`${tableIndex}-${rowIndex}-${colIndex}`}
                      className="border px-2 py-1 text-gray-600"
                    >
                      {table.groupByDate || table.groupByHour ? (
                        '-'
                      ) : Array.isArray(res.value) ? (
                        <div>
                          <button
                            className="text-blue-500 underline"
                            onClick={() => toggleExpanded(tableIndex, rowIndex, colIndex)}
                          >
                            {expandedCells[`${tableIndex}-${rowIndex}-${colIndex}`]
                              ? 'Скрыть массив'
                              : 'Показать массив'}
                          </button>
                          {expandedCells[`${tableIndex}-${rowIndex}-${colIndex}`] && (
                            <span className="mt-2 block">
                              {res.value.join(', ')}
                            </span>
                          )}
                        </div>
                      ) : (
                        res.value !== null && res.value !== undefined ? res.value : '-'
                      )}
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Button */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={exportToExcel}
            className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-1/2 flex items-center justify-center"
          >
            <FaCheckCircle className="mr-2" />
            <span>Экспортировать в Excel</span>
          </button>
        </div>
      </div>

      {/* Subject-Specific Tables */}
      {table.groupByDate || table.groupByHour ? (
        <>
          <h2 className="text-lg font-semibold mb-4">Таблицы по субъектам</h2>
          {table.tableConfig.map((item) => {
            // Unique key combining subject and objects
            const uniqueKey = `${item.subject}_${item.objects.join(',')}`;
            return (
              <div key={uniqueKey} className="mb-6">
                <div className="flex items-center space-x-4 mb-2">
                  <button
                    onClick={() => toggleSubTableVisibility(uniqueKey)}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1"
                  >
                    {isSubTableVisible(uniqueKey)
                      ? `Скрыть данные для ${getRowName(subjectList, allObjects, item.subject, item.objects)}`
                      : `Показать данные для ${getRowName(subjectList, allObjects, item.subject, item.objects)}`}
                  </button>
                </div>

                {isSubTableVisible(uniqueKey) && (
                  <div className="overflow-x-auto mt-4">
                    {item.data[0]?.date_value?.length > 0 ? (
                      <div className="mb-4">
                        <table className="min-w-full bg-white border border-gray-200 shadow-md table-auto">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                                Дата
                              </th>
                              {table.groupByHour && (
                                <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                                  Час
                                </th>
                              )}
                              {item.data.map((res, colIdx) => (
                                <th
                                  key={colIdx}
                                  className="px-2 py-1 text-left text-gray-700 font-semibold border-b"
                                >
                                  {res.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Prepare data for display */}
                            {(() => {
                              const dateValueMap = {};
                              item.data.forEach((res) => {
                                res.date_value.forEach((dateItem) => {
                                  const date = dateItem.date;
                                  const value = dateItem.value;
                                  if (!dateValueMap[date]) {
                                    dateValueMap[date] = {};
                                  }
                                  if (Array.isArray(value)) {
                                    if (table.groupByHour) {
                                      // value is an array of objects with hour and value
                                      value.forEach((hourItem) => {
                                        const hour = hourItem.hour;
                                        if (!dateValueMap[date][hour]) {
                                          dateValueMap[date][hour] = {};
                                        }
                                        dateValueMap[date][hour][res.name] = hourItem.value;
                                      });
                                    } else {
                                      // value is an array of numbers
                                      dateValueMap[date][res.name] = value;
                                    }
                                  } else {
                                    // value is a single number
                                    dateValueMap[date][res.name] = value;
                                  }
                                });
                              });

                              const rows = [];
                              Object.keys(dateValueMap).forEach((date) => {
                                if (table.groupByHour) {
                                  const hours = Object.keys(dateValueMap[date]);
                                  hours.forEach((hour, hourIdx) => {
                                    rows.push(
                                      <tr key={`${date}-${hour}`} className="hover:bg-gray-50">
                                        {hourIdx === 0 && (
                                          <td
                                            rowSpan={hours.length}
                                            className="border px-2 py-1 text-gray-600 w-32"
                                          >
                                            {date}
                                          </td>
                                        )}
                                        <td className="border px-2 py-1 text-gray-600">
                                          {hour}
                                        </td>
                                        {item.data.map((res, resIdx) => (
                                          <td key={resIdx} className="border px-2 py-1 text-gray-600">
                                            {dateValueMap[date][hour][res.name] !== null && dateValueMap[date][hour][res.name] !== undefined
                                              ? dateValueMap[date][hour][res.name]
                                              : '-'}
                                          </td>
                                        ))}
                                      </tr>
                                    );
                                  });
                                } else {
                                  // When groupByHour is false
                                  rows.push(
                                    <tr key={`${date}`} className="hover:bg-gray-50">
                                      <td className="border px-2 py-1 text-gray-600">
                                        {date}
                                      </td>
                                      {item.data.map((res, resIdx) => (
                                        <td key={resIdx} className="border px-2 py-1 text-gray-600">
                                          {(() => {
                                            const cellValue = dateValueMap[date][res.name];
                                            if (Array.isArray(cellValue)) {
                                              // New Feature: Toggle Array Display as Comma-Separated String
                                              const subTableKey = `${uniqueKey}-${date}-${res.name}`;
                                              return (
                                                <div>
                                                  <button
                                                    className="text-blue-500 underline"
                                                    onClick={() => toggleSubTableCellExpanded(uniqueKey, date, res.name)}
                                                  >
                                                    {expandedSubTableCells[subTableKey]
                                                      ? 'Скрыть массив'
                                                      : 'Показать массив'}
                                                  </button>
                                                  {expandedSubTableCells[subTableKey] && (
                                                    <span className="mt-2 block">
                                                      {cellValue.join(', ')}
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            } else {
                                              return cellValue !== null && cellValue !== undefined
                                                ? cellValue
                                                : '-';
                                            }
                                          })()}
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                }
                              });
                              return rows;
                            })()}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div>Нет данных для отображения</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : null}
    </div>
  );
};

export default TableComponent;

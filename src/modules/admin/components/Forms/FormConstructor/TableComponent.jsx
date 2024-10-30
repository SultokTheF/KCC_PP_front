// TableComponent.jsx

import React, { useState } from 'react';
import { FaTrashAlt, FaPlusCircle, FaCheckCircle } from 'react-icons/fa'; // Added FaCheckCircle
import FormulaEditor from './FormulaEditor';
import { getSubjectName, getRowName } from './utils';
import * as XLSX from 'xlsx'; // Import XLSX for export functionality
import { Circles } from 'react-loader-spinner'; // Import loader

const TableComponent = ({
  table,
  tableIndex,
  subjectList,
  selectedSubject,
  setSelectedSubject,
  selectedOperation,
  formulaInput,
  setFormulaInput,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  updateColumnName,
  visibleSubTables,
  setVisibleSubTables,
  objectsList,
  selectedObjects,
  setSelectedObjects,
  updateCellOperation,
  allObjects,
  users, // Passed from FormConstructor
  selectedUsers, // Passed from FormConstructor
  setSelectedUsers, // Passed from FormConstructor
  handleSubmit, // Passed from FormConstructor
  exportToExcel, // Passed from FormConstructor
  isSubmitting, // Passed from FormConstructor
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

  const handleObjectToggle = (objId) => {
    setSelectedObjects((prevSelectedObjects) =>
      prevSelectedObjects.includes(objId)
        ? prevSelectedObjects.filter((id) => id !== objId) // Remove unchecked object
        : [...prevSelectedObjects, objId] // Add checked object
    );
  };

  // Function to handle user selection toggle
  const handleUserToggle = (userId) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(userId)
        ? prevSelectedUsers.filter((id) => id !== userId) // Remove unchecked user
        : [...prevSelectedUsers, userId] // Add checked user
    );
  };

  return (
    <div className="mb-10">
      {/* Table Name Input */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-1">Название таблицы:</label>
        <input
          type="text"
          value={table.name}
          onChange={(e) => updateColumnName(tableIndex, 'name', e.target.value)}
          className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Global Date Inputs */}
      <div className="flex space-x-6 mb-6">
        <div className="w-1/2">
          <label className="block text-gray-700 mb-1">Дата начала</label>
          <input
            type="date"
            value={table.startDate}
            onChange={(e) =>
              updateColumnName(tableIndex, 'startDate', e.target.value)
            }
            className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-1/2">
          <label className="block text-gray-700 mb-1">Дата окончания</label>
          <input
            type="date"
            value={table.endDate}
            onChange={(e) =>
              updateColumnName(tableIndex, 'endDate', e.target.value)
            }
            className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Group By Options */}
      <div className="flex items-center space-x-6 mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={table.groupByDate}
            onChange={(e) =>
              updateColumnName(tableIndex, 'groupByDate', e.target.checked)
            }
            className="mr-2"
          />
          Группировать по дате
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={table.groupByHour}
            onChange={(e) =>
              updateColumnName(tableIndex, 'groupByHour', e.target.checked)
            }
            className="mr-2"
          />
          Группировать по часу
        </label>
      </div>

      {/* Exclude Holidays Options */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-1">Исключить праздничные дни:</label>
        <div className="flex items-center space-x-6">
          {['Russia', 'Kazakhstan', 'Weekend'].map((country) => (
            <label key={country} className="flex items-center">
              <input
                type="checkbox"
                checked={table.excludeHolidays[country]}
                onChange={(e) =>
                  updateColumnName(tableIndex, 'excludeHolidays', {
                    ...table.excludeHolidays,
                    [country]: e.target.checked,
                  })
                }
                className="mr-2"
              />
              {country}
            </label>
          ))}
        </div>
      </div>

      {/* Add Row Section */}
      <div className="mb-6 space-x-4 flex items-center">
        <label className="block text-gray-700">Выберите субъект:</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Выберите субъект</option>
          {subjectList.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.subject_name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {objectsList.map((obj) => (
            <div key={obj.id} className="flex items-center">
              <input
                type="checkbox"
                id={`object-${obj.id}`}
                checked={selectedObjects.includes(obj.id)}
                onChange={() => handleObjectToggle(obj.id)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor={`object-${obj.id}`}
                className="ml-3 text-gray-700"
              >
                {obj.object_name}
              </label>
            </div>
          ))}
        </div>
        <button
          onClick={() => addRow(tableIndex)}
          className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center space-x-1"
        >
          <FaPlusCircle className="mr-1" />
          <span>Добавить строку</span>
        </button>
      </div>

      {/* Add Column Section */}
      <div className="mb-6 space-x-4 flex items-center">
        {selectedOperation === "formula" && (
          <div className="flex items-center space-x-4">
            <label className="block text-gray-700">Введите формулу:</label>
            <FormulaEditor value={formulaInput} onChange={setFormulaInput} />
          </div>
        )}

        <button
          onClick={() => addColumn(tableIndex)}
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1"
        >
          <FaPlusCircle className="mr-1" />
          <span>Добавить колонку</span>
        </button>
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
                    <button
                      className="ml-2 text-red-500 hover:text-red-700 flex items-center"
                      onClick={() => deleteColumn(tableIndex, index)}
                    >
                      <FaTrashAlt className="mr-1" />
                      <span>Удалить</span>
                    </button>
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
                    <button
                      className="ml-2 text-red-500 hover:text-red-700 flex items-center"
                      onClick={() => deleteRow(tableIndex, rowIndex)}
                    >
                      <FaTrashAlt className="mr-1" />
                      <span>Удалить</span>
                    </button>
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

      {/* User Selection and Submit/Export Buttons */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Выбор пользователей</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center">
              <input
                type="checkbox"
                id={`user-${user.id}`}
                checked={selectedUsers.includes(user.id)}
                onChange={() => handleUserToggle(user.id)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor={`user-${user.id}`}
                className="ml-3 text-gray-700"
              >
                {user.email} ({user.role})
              </label>
            </div>
          ))}
        </div>

        {/* Submit and Export buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleSubmit}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-1/2 flex items-center justify-center"
            disabled={isSubmitting} // Disable button when submitting
          >
            <FaCheckCircle className="mr-2" />
            <span>Отправить</span>
          </button>

          <button
            onClick={exportToExcel}
            className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-1/2 flex items-center justify-center"
          >
            <FaCheckCircle className="mr-2" />
            <span>Экспортировать в Excel</span>
          </button>
        </div>

        {/* Loader */}
        {isSubmitting && (
          <div className="flex justify-center mt-4">
            <Circles color="#00BFFF" height={80} width={80} />
          </div>
        )}
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
                  {/* Removed the export button */}
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

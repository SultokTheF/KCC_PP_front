// src/components/FormConstructor/TableComponent.jsx

import React from 'react';
import { FaTrashAlt, FaPlusCircle } from 'react-icons/fa';
import FormulaEditor from './FormulaEditor';

const TableComponent = ({
  table,
  tableIndex,
  subjectList,
  hourFields,
  operationMappings,
  defaultOperations,
  selectedSubject,
  setSelectedSubject,
  selectedOperation,
  setSelectedOperation,
  formulaInput,
  setFormulaInput,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  updateColumnName,
  getSubjectName,
  visibleSubTables,
  setVisibleSubTables,
}) => {
  // Function to toggle sub-table visibility by date
  const toggleSubTableVisibility = (date) => {
    setVisibleSubTables((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Function to check if a sub-table for a date is visible
  const isSubTableVisible = (date) => {
    return visibleSubTables[date];
  };

  // Extract all unique dates from all results
  const getAllUniqueDates = () => {
    const datesSet = new Set();
    table.tableConfig.forEach((item) => {
      item.data.forEach((result) => {
        if (result.date_value) {
          result.date_value.forEach((dv) => datesSet.add(dv.date));
        }
      });
    });
    return Array.from(datesSet).sort();
  };

  // Prepare a flat list of all results across all subjects
  const getAllResults = () => {
    const results = [];
    table.tableConfig.forEach((item) => {
      item.data.forEach((res) => {
        results.push({
          ...res,
          subjectName: getSubjectName(item.subject),
        });
      });
    });
    return results;
  };

  // Prepare data grouped by date
  const getDataGroupedByDate = () => {
    const groupedData = {};
    table.tableConfig.forEach((item) => {
      item.data.forEach((result) => {
        if (result.date_value) {
          result.date_value.forEach((dv) => {
            if (!groupedData[dv.date]) {
              groupedData[dv.date] = {};
            }
            groupedData[dv.date][result.id] = dv.value; // Use result.id as key
          });
        }
      });
    });
    return groupedData;
  };

  const uniqueDates = getAllUniqueDates();
  const allResults = getAllResults();
  const dataGroupedByDate = getDataGroupedByDate();

  return (
    <div className="mb-10">
      {/* Table Name Input */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-1">
          Название таблицы:
        </label>
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
            onChange={(e) => updateColumnName(tableIndex, 'startDate', e.target.value)}
            className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-1/2">
          <label className="block text-gray-700 mb-1">
            Дата окончания
          </label>
          <input
            type="date"
            value={table.endDate}
            onChange={(e) => updateColumnName(tableIndex, 'endDate', e.target.value)}
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
        <label className="block text-gray-700 mb-1">
          Исключить праздничные дни:
        </label>
        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={table.excludeHolidays.Russia}
              onChange={(e) =>
                updateColumnName(tableIndex, 'excludeHolidays', {
                  ...table.excludeHolidays,
                  Russia: e.target.checked,
                })
              }
              className="mr-2"
            />
            Россия
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={table.excludeHolidays.Kazakhstan}
              onChange={(e) =>
                updateColumnName(tableIndex, 'excludeHolidays', {
                  ...table.excludeHolidays,
                  Kazakhstan: e.target.checked,
                })
              }
              className="mr-2"
            />
            Казахстан
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={table.excludeHolidays.Weekend}
              onChange={(e) =>
                updateColumnName(tableIndex, 'excludeHolidays', {
                  ...table.excludeHolidays,
                  Weekend: e.target.checked,
                })
              }
              className="mr-2"
            />
            Выходные
          </label>
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
          {subjectList.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.subject_name}
            </option>
          ))}
        </select>
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
      <div className="overflow-x-auto max-w-full mb-6">
        <table className="min-w-full max-w-[1200px] bg-white border border-gray-200 shadow-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-gray-700 font-semibold border-b">
                Субъекты
              </th>
              {table.tableConfig.length > 0 &&
                table.tableConfig[0].data.map((res, index) => (
                  <th
                    key={res.id}
                    className="px-4 py-2 text-left text-gray-700 font-semibold border-b"
                  >
                    <input
                      type="text"
                      value={res.name}
                      onChange={(e) =>
                        updateColumnName(tableIndex, index, e.target.value)
                      }
                      className="border border-gray-300 rounded-md p-1 focus:ring-2 focus:ring-blue-500"
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
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="border px-4 py-2 text-gray-600">
                  {getSubjectName(item.subject)}
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
                    key={res.id}
                    className="border px-4 py-2 text-gray-600"
                  >
                    {/* Since sub-tables are now grouped by date, you can display a summary or keep it empty */}
                    -
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sub-Tables Grouped by Date */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Детализированные данные по датам</h2>
        {uniqueDates.map((date) => (
          <div key={date} className="mb-4">
            <button
              onClick={() => toggleSubTableVisibility(date)}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1"
            >
              {isSubTableVisible(date) ? "Скрыть данные" : "Показать данные"} для {date}
            </button>

            {isSubTableVisible(date) && (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full max-w-[1200px] bg-gray-100 border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-2 py-1 text-left text-gray-700 border-b">Час</th>
                      {allResults.map((res) => (
                        <th
                          key={res.id}
                          className="px-2 py-1 text-left text-gray-700 border-b"
                        >
                          {res.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hourFields.map((hour, hourIdx) => (
                      <tr key={hourIdx} className="hover:bg-gray-50">
                        <td className="border px-2 py-1 text-gray-600">{hourIdx + 1} час</td>
                        {allResults.map((res) => {
                          // Find the date_value for this date
                          const dv = res.date_value?.find(dv => dv.date === date);
                          let value = "-";
                          if (dv && Array.isArray(dv.value)) {
                            const cellValue = dv.value[hourIdx];
                            // If cellValue is an object, extract the 'value' property
                            if (typeof cellValue === 'object' && cellValue !== null) {
                              value = cellValue.value !== undefined ? cellValue.value : '-';
                            } else {
                              value = cellValue !== null && cellValue !== undefined ? cellValue : '-';
                            }
                          }
                          return (
                            <td
                              key={`${res.id}-${hourIdx}`}
                              className="border px-2 py-1 text-gray-600"
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableComponent;

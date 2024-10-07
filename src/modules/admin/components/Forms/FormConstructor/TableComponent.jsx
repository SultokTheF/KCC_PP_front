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
  conditionOperators,
  selectedSubject,
  setSelectedSubject,
  selectedField,
  setSelectedField,
  selectedOperation,
  setSelectedOperation,
  customOperation,
  setCustomOperation,
  conditionField,
  setConditionField,
  conditionOperator,
  setConditionOperator,
  conditionValue,
  setConditionValue,
  formulaInput,
  setFormulaInput,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  updateColumnName,
  getSubjectName,
  renderValue,
  toggleSubTableVisibility,
  isSubTableVisible,
  visibleSubTables,
}) => {
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
                {item.data.map((res, colIndex) => {
                  const key = `${tableIndex}-${rowIndex}-${colIndex}`;
                  return (
                    <td
                      key={res.id}
                      className="border px-4 py-2 text-gray-600"
                    >
                      {renderValue(res, key)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render Detailed Data for Each Result with date_value */}
      {table.tableConfig.map((item, rowIndex) =>
        item.data.map((result, colIndex) => {
          if (result.date_value && result.date_value.length > 0) {
            const subjectName = getSubjectName(item.subject);
            const label = `${subjectName} - ${table.name} - ${result.name}`;
            const key = `${tableIndex}-${rowIndex}-${colIndex}`;
            if (!isSubTableVisible(key)) {
              return null;
            }
            return result.date_value.map((dateItem, index) =>
              Array.isArray(dateItem.value) ? (
                <div key={`${label}-${dateItem.date}-${index}`}>
                  <h3 className="text-lg font-bold mb-2">
                    {label} - {dateItem.date}
                    <button
                      onClick={() => toggleSubTableVisibility(key)}
                      className="ml-4 text-blue-500 hover:underline"
                    >
                      Скрыть данные
                    </button>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full max-w-[1200px] bg-gray-100 border border-gray-300">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-left text-gray-700 border-b">
                            Дата
                          </th>
                          {Array.from({ length: 24 }, (_, i) => (
                            <th
                              key={i}
                              className="px-2 py-1 text-left text-gray-700 border-b"
                            >
                              {i + 1} час
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr key={dateItem.date}>
                          <td className="border px-4 py-2 text-gray-600">{dateItem.date}</td>
                          {dateItem.value.map((hourValue, hourIndex) => (
                            <td key={hourIndex} className="border px-4 py-2 text-gray-600">
                              {hourValue.value || 0}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div key={`${label}-${dateItem.date}-${index}`}>
                  <h3 className="text-lg font-bold mb-2">
                    {label} - {dateItem.date}
                    <button
                      onClick={() => toggleSubTableVisibility(key)}
                      className="ml-4 text-blue-500 hover:underline"
                    >
                      Скрыть данные
                    </button>
                  </h3>
                  Значение: {dateItem.value}
                </div>
              )
            );
          }
          return null;
        })
      )}
    </div>
  );
};

export default TableComponent;

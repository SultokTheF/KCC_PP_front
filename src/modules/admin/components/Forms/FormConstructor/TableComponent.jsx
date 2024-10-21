// TableComponent.js
import React from 'react';
import { FaTrashAlt, FaPlusCircle, FaFileExport } from 'react-icons/fa';
import FormulaEditor from './FormulaEditor';
import { getSubjectName, getObjectName } from './utils';
import * as XLSX from 'xlsx'; // Import XLSX for export functionality

const TableComponent = ({
  table,
  tableIndex,
  subjectList,
  hourFields,
  selectedSubject,
  setSelectedSubject,
  selectedOperation,
  setSelectedOperation,
  formulaInput,
  setTables,
  setFormulaInput,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  updateColumnName,
  visibleSubTables,
  setVisibleSubTables,
  objects,
}) => {
  // Function to check if a sub-table for a subject is visible
  const isSubTableVisible = (subjectId) => {
    return visibleSubTables[subjectId] || false; // Ensure it returns `false` if not defined
  };

  const toggleObjectTableVisibility = (objectId) => {
    setVisibleSubTables((prev) => ({
      ...prev,
      [objectId]: !prev[objectId],
    }));
  };


  // Function to handle object checkbox changes
  const handleObjectSelection = (subjectId, objectId, isChecked) => {
    setTables((prevTables) =>
      prevTables.map((table, idx) => {
        if (idx === tableIndex) {
          return {
            ...table,
            tableConfig: table.tableConfig.map((item) => {
              if (item.subject === subjectId) {
                const updatedObjects = isChecked
                  ? [...(item.selectedObjects || []), objectId]
                  : (item.selectedObjects || []).filter((id) => id !== objectId);

                return {
                  ...item,
                  selectedObjects: updatedObjects,
                };
              }
              return item;
            }),
          };
        }
        return table;
      })
    );
  };

  // Toggle visibility for each subject
  const toggleSubTableVisibility = (subjectId) => {
    setVisibleSubTables((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const exportObjectToExcel = (objectItem) => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    // Header row for object export
    const header = ['Дата', 'Объект', 'Субъект', 'Час'];
    objectItem.data.forEach((res) => {
      header.push(res.name);
    });
    wsData.push(header);

    // Data rows
    if (objectItem.data[0]?.date_value?.length > 0) {
      objectItem.data[0].date_value.forEach((dateItem) => {
        dateItem.value.forEach((hourItem) => {
          const row = [
            dateItem.date,
            objectItem.object,
            getSubjectName(subjectList, objectItem.subject),
            hourItem.hour,
          ];
          objectItem.data.forEach((res) => {
            const value =
              res.date_value
                ?.find((d) => d.date === dateItem.date)
                ?.value.find((h) => h.hour === hourItem.hour)?.value || '-';
            row.push(value);
          });
          wsData.push(row);
        });
      });
    }

    // Create worksheet and save to file
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const sheetName = `${table.name}_Object_${getObjectName(objects, objectItem.object)}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
  };

  // Function to export individual subject table to Excel
  const exportSubjectToExcel = (subjectItem) => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    // Header row
    const header = ['Дата', 'Субъект', 'Час'];
    subjectItem.data.forEach((res) => {
      header.push(res.name);
    });
    wsData.push(header);

    // Data rows
    if (subjectItem.data[0]?.date_value?.length > 0) {
      subjectItem.data[0].date_value.forEach((dateItem) => {
        dateItem.value.forEach((hourItem) => {
          const row = [
            dateItem.date,
            getSubjectName(subjectList, subjectItem.subject),
            hourItem.hour,
          ];
          subjectItem.data.forEach((res) => {
            const value =
              res.date_value
                ?.find((d) => d.date === dateItem.date)
                ?.value.find((h) => h.hour === hourItem.hour)?.value || '-';
            row.push(value);
          });
          wsData.push(row);
        });
      });
    } else {
      // If no date_value, add a single row
      const row = [
        table.startDate || '-',
        getSubjectName(subjectList, subjectItem.subject),
        '-',
      ];
      subjectItem.data.forEach((res) => {
        row.push(res.value || '-');
      });
      wsData.push(row);
    }

    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const sheetName = `${table.name}_${getSubjectName(
      subjectList,
      subjectItem.subject
    )}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Save to file
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
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
        {table.tableConfig.length > 0 ? (
          <table className="min-w-full bg-white border border-gray-200 shadow-md table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                  Субъекты
                </th>
                {table.tableConfig[0].data.map((res, index) => (
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
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="border px-2 py-1 text-gray-600">
                    {getSubjectName(subjectList, item.subject)}
                    <div className="mt-2">
                      {objects
                        .filter((obj) => obj.subject === item.subject)
                        .map((obj) => (
                          <label key={obj.id} className="block">
                            <input
                              type="checkbox"
                              checked={(item.selectedObjects || []).includes(obj.id)}
                              onChange={(e) =>
                                handleObjectSelection(item.subject, obj.id, e.target.checked)
                              }
                              className="mr-2"
                            />
                            {obj.object_name}
                          </label>
                        ))}
                    </div>
                    <button
                      className="ml-2 text-red-500 hover:text-red-700 flex items-center"
                      onClick={() => deleteRow(tableIndex, rowIndex)}
                    >
                      <FaTrashAlt className="mr-1" />
                      <span>Удалить</span>
                    </button>
                  </td>
                  {item.data.map((res, colIndex) => (
                    <td key={colIndex} className="border px-2 py-1 text-gray-600">
                      {table.groupByDate || table.groupByHour
                        ? '-'
                        : Array.isArray(res.value)
                          ? res.value.join(', ')
                          : res.value || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>Нет строк в таблице.</div>
        )}
      </div>

      {/* Subject-Specific Tables */}
      {table.groupByDate || table.groupByHour ? (
        <>
          <h2 className="text-lg font-semibold mb-4">Таблицы по субъектам</h2>
          {table.tableConfig.length > 0 ? (
            table.tableConfig.map((item) => (
              <div key={item.subject} className="mb-6">
                <div className="flex items-center space-x-4 mb-2">
                  <button
                    onClick={() => toggleSubTableVisibility(item.subject)}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1"
                  >
                    {isSubTableVisible(item.subject)
                      ? `Скрыть данные для ${getSubjectName(subjectList, item.subject)}`
                      : `Показать данные для ${getSubjectName(subjectList, item.subject)}`}
                  </button>
                  <button
                    onClick={() => exportSubjectToExcel(item)}
                    className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center space-x-1"
                  >
                    <FaFileExport className="mr-1" />
                    <span>Экспортировать</span>
                  </button>
                </div>

                {isSubTableVisible(item.subject) && (
                  <div className="overflow-x-auto mt-4">
                    {item.data.length > 0 && item.data[0]?.date_value?.length > 0 ? (
                      <div className="mb-4">
                        <table className="min-w-full bg-white border border-gray-200 shadow-md table-auto">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                                Дата
                              </th>
                              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                                Час
                              </th>
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
                            {item.data[0].date_value.map((dateItem, dateIdx) =>
                              dateItem.value.map((hourItem, hourIdx, hourArr) => (
                                <tr key={`${dateIdx}-${hourIdx}`} className="hover:bg-gray-50">
                                  {hourIdx === 0 && (
                                    <td
                                      rowSpan={hourArr.length}
                                      className="border px-2 py-1 text-gray-600 w-32"
                                    >
                                      {dateItem.date}
                                    </td>
                                  )}
                                  <td className="border px-2 py-1 text-gray-600">
                                    {hourItem.hour}
                                  </td>
                                  {item.data.map((res, resIdx) => (
                                    <td key={resIdx} className="border px-2 py-1 text-gray-600">
                                      {res.date_value &&
                                        res.date_value[dateIdx]?.value[hourIdx]?.value || '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div>Нет данных для отображения</div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div>Нет данных по субъектам.</div>
          )}
        </>
      ) : null}

      {/* Render the objects table */}
      <h2 className="text-lg font-semibold mb-4">Таблицы по Объектам</h2>
      {table.objectConfig.length > 0 ? (
        table.objectConfig.map((objectItem) => (
          <div key={objectItem.object} className="mb-6">
            <div className="flex items-center space-x-4 mb-2">
              <button
                onClick={() => toggleObjectTableVisibility(objectItem.object)}
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1"
              >
                {visibleSubTables[objectItem.object]
                  ? `Скрыть данные для ${getObjectName(objects, objectItem.object)}`
                  : `Показать данные для ${getObjectName(objects, objectItem.object)}`}
              </button>
              <button
                onClick={() => exportObjectToExcel(objectItem)}
                className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center space-x-1"
              >
                <FaFileExport className="mr-1" />
                <span>Экспортировать</span>
              </button>
            </div>

            {visibleSubTables[objectItem.object] && (
              <div className="overflow-x-auto mt-4">
                {objectItem.data.length > 0 && objectItem.data[0]?.date_value?.length > 0 ? (
                  <div className="mb-4">
                    <table className="min-w-full bg-white border border-gray-200 shadow-md table-auto">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                            Дата
                          </th>
                          <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                            Час
                          </th>
                          <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                            Субъект
                          </th>
                          <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                            Объект
                          </th>
                          {objectItem.data.map((res, colIdx) => (
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
                        {objectItem.data[0].date_value.map((dateItem, dateIdx) =>
                          dateItem.value.map((hourItem, hourIdx, hourArr) => (
                            <tr key={`${dateIdx}-${hourIdx}`} className="hover:bg-gray-50">
                              {hourIdx === 0 && (
                                <td
                                  rowSpan={hourArr.length}
                                  className="border px-2 py-1 text-gray-600 w-32"
                                >
                                  {dateItem.date}
                                </td>
                              )}
                              <td className="border px-2 py-1 text-gray-600">
                                {hourItem.hour}
                              </td>
                              <td className="border px-2 py-1 text-gray-600">
                                {getSubjectName(subjectList, objectItem.subject)}
                              </td>
                              <td className="border px-2 py-1 text-gray-600">
                                {getObjectName(objects, objectItem.object)}
                              </td>
                              {objectItem.data.map((res, resIdx) => (
                                <td key={resIdx} className="border px-2 py-1 text-gray-600">
                                  {res.date_value &&
                                    res.date_value[dateIdx]?.value[hourIdx]?.value || '-'}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div>Нет данных для отображения</div>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <div>Нет данных по объектам.</div>
      )}
    </div>
  );
};

export default TableComponent;

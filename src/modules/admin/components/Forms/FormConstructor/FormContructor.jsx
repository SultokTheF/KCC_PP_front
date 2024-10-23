// FormConstructor.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import Sidebar from "../../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import TableComponent from "./TableComponent";
import useFetchData from './useFetchData';
import { hourFields } from './constants';
import { processTableData, getRowName } from './utils';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx'; // Import XLSX library
import { Circles } from 'react-loader-spinner'; // Loader component

const FormConstructor = () => {
  const { id } = useParams();
  const { subjectList, tables, setTables } = useFetchData(id);

  // States
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedOperation, setSelectedOperation] = useState("formula");
  const [formulaInput, setFormulaInput] = useState("");
  const [visibleSubTables, setVisibleSubTables] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Loader state

  const [allObjects, setAllObjects] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);

  // Fetch objects based on selected subject
  const fetchObjects = async (subjectId) => {
    try {
      const objectsResponse = await axiosInstance.get(endpoints.OBJECTS, {
        params: { sub: subjectId },
      });
      setObjectsList(objectsResponse.data);
      setSelectedObjects(objectsResponse.data.map((obj) => obj.id)); // Select all objects by default
    } catch (error) {
      console.error('Error fetching objects:', error);
      // Optionally, set an error state here
    }
  };

  const fetchAllObjects = async () => {
    try {
      const objectsResponse = await axiosInstance.get(endpoints.OBJECTS);
      setAllObjects(objectsResponse.data);
    } catch (error) {
      console.error('Error fetching objects:', error);
      // Optionally, set an error state here
    }
  };

  useEffect(() => {
    fetchAllObjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchObjects(selectedSubject);
    }
  }, [selectedSubject]);

  // Helper function to compare two arrays (order-insensitive)
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
  };

  // Add a new row (subject + selected objects) to a specific table
  const addRow = (tableIndex) => {
    if (!selectedSubject) return; // Removed the objects selection requirement

    // Check if a row with the same subject and objects already exists
    const existingRow = tables[tableIndex].tableConfig.find(
      (row) =>
        row.subject === parseInt(selectedSubject) &&
        arraysEqual(row.objects, selectedObjects.map(id => parseInt(id)))
    );

    if (existingRow) {
      alert("Строка с выбранным субъектом и объектами уже существует.");
      return;
    }

    setTables((prevTables) =>
      prevTables.map((table, idx) => {
        if (idx === tableIndex) {
          // Get existing columns (data) from first subject
          const existingData =
            table.tableConfig.length > 0 ? table.tableConfig[0].data : [];

          // Create new data for the new subject and objects
          const newData = existingData.map((res) => ({
            ...res,
            subject: parseInt(selectedSubject),
            objects: selectedObjects.map(id => parseInt(id)), // Can be an empty array
            value: null,
            date_value: null,
            // Assign new IDs
            id: uuidv4(),
          }));

          return {
            ...table,
            tableConfig: [
              ...table.tableConfig,
              {
                subject: parseInt(selectedSubject),
                objects: selectedObjects.map(id => parseInt(id)),
                data: newData,
              },
            ],
          };
        }
        return table;
      })
    );
  };

  // Add a new column (result) to a specific table
  const addColumn = (tableIndex) => {
    let newResult = null;

    if (selectedOperation === "formula") {
      newResult = {
        plan: "formula",
        name: formulaInput || "Формула",
        operation: formulaInput,
        params: [],
        id: uuidv4(),
        date_value: [], // Ensure date_value is initialized
      };
    } else if (selectedOperation === "array") {
      newResult = {
        plan: "array",
        name: "Массив",
        operation: "array",
        params: [],
        id: uuidv4(),
        date_value: [], // Ensure date_value is initialized
      };
    }

    if (!newResult) return;

    setTables((prevTables) =>
      prevTables.map((table, idx) => {
        if (idx === tableIndex) {
          return {
            ...table,
            tableConfig: table.tableConfig.map((item) => ({
              ...item,
              data: [...item.data, newResult],
            })),
          };
        }
        return table;
      })
    );
  };

  // Delete a row (subject + objects) from a specific table
  const deleteRow = (tableIndex, rowIndex) => {
    setTables((prevTables) =>
      prevTables.map((table, idx) => {
        if (idx === tableIndex) {
          return {
            ...table,
            tableConfig: table.tableConfig.filter((_, i) => i !== rowIndex),
          };
        }
        return table;
      })
    );
  };

  // Delete a column (result) from a specific table
  const deleteColumn = (tableIndex, colIndex) => {
    setTables((prevTables) =>
      prevTables.map((table, idx) => {
        if (idx === tableIndex) {
          return {
            ...table,
            tableConfig: table.tableConfig.map((item) => ({
              ...item,
              data: item.data.filter((_, i) => i !== colIndex),
            })),
          };
        }
        return table;
      })
    );
  };

  // Update column name or other table properties
  const updateColumnName = (tableIndex, columnKey, newValue) => {
    setTables((prevTables) =>
      prevTables.map((table, idx) => {
        if (idx === tableIndex) {
          if (columnKey === 'name') {
            return {
              ...table,
              name: newValue,
            };
          } else if (columnKey === 'startDate') {
            return {
              ...table,
              startDate: newValue,
            };
          } else if (columnKey === 'endDate') {
            return {
              ...table,
              endDate: newValue,
            };
          } else if (columnKey === 'groupByDate') {
            return {
              ...table,
              groupByDate: newValue,
            };
          } else if (columnKey === 'groupByHour') {
            return {
              ...table,
              groupByHour: newValue,
            };
          } else if (columnKey === 'excludeHolidays') {
            return {
              ...table,
              excludeHolidays: newValue,
            };
          } else {
            // Assume columnKey is a number for column index
            return {
              ...table,
              tableConfig: table.tableConfig.map((item) => {
                if (typeof columnKey === 'number') {
                  return {
                    ...item,
                    data: item.data.map((res, resIdx) => {
                      if (resIdx === columnKey) {
                        return { ...res, name: newValue };
                      }
                      return res;
                    }),
                  };
                }
                return item;
              }),
            };
          }
        }
        return table;
      })
    );
  };

  // Update cell operation
  const updateCellOperation = (tableIndex, rowIndex, columnIndex, newValue) => {
    setTables((prevTables) =>
      prevTables.map((table, idx) => {
        if (idx === tableIndex) {
          return {
            ...table,
            tableConfig: table.tableConfig.map((row, rIdx) => {
              if (rIdx === rowIndex) {
                return {
                  ...row,
                  data: row.data.map((cell, cIdx) => {
                    if (cIdx === columnIndex) {
                      return {
                        ...cell,
                        operation: newValue,
                      };
                    }
                    return cell;
                  }),
                };
              }
              return row;
            }),
          };
        }
        return table;
      })
    );
  };

  // Submit the tables data
  const handleSubmit = async () => {
    setIsSubmitting(true); // Show loader

    // Prepare the data to match the server's expected format
    const finalData = tables.map((table) => ({
      name: table.name,
      start_date: table.startDate,
      end_date: table.endDate,
      group_by_date: table.groupByDate,
      group_by_hour: table.groupByHour,
      exclude_holidays: table.excludeHolidays,
      data: table.tableConfig
        .map((item) =>
          item.data.map((res) => ({
            subject: item.subject,
            objects: item.objects, // Can be an empty array
            plan: res.plan,
            name: res.name,
            operation: res.operation,
            params: res.params,
          }))
        )
        .flat(),
    }));

    try {
      const dataToSend = finalData.length === 1 ? finalData[0] : finalData;

      const response = await axiosInstance.put(endpoints.TABLE(id), dataToSend);

      if (response.status === 200) {
        const updatedTableResponse = await axiosInstance.get(endpoints.TABLE(id));
        const tablesData = Array.isArray(updatedTableResponse.data)
          ? updatedTableResponse.data
          : [updatedTableResponse.data];

        // Process tablesData to merge date_value arrays
        const newTables = tablesData.map((tableData) => {
          const processedTable = processTableData(tableData);
          return processedTable;
        });
        setTables(newTables);
      }
    } catch (error) {
      console.error("Ошибка при отправке данных на сервер:", error);
      // Optionally, handle error state here
    } finally {
      setIsSubmitting(false); // Hide loader
    }
  };

  // Function to export tables to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    tables.forEach((table) => {
      table.tableConfig.forEach((item) => {
        const wsData = [];

        // Header row
        const header = ['Дата'];
        if (table.groupByHour) {
          header.push('Час');
        }
        header.push('Субъект');
        item.data.forEach((res) => {
          header.push(res.name);
        });
        wsData.push(header);

        // Data rows
        if (item.data[0]?.date_value?.length > 0) {
          // Merge date_value arrays
          const dateValueMap = {};
          item.data.forEach((res) => {
            res.date_value.forEach((dateItem) => {
              const date = dateItem.date;
              const value = dateItem.value;
              if (!dateValueMap[date]) {
                dateValueMap[date] = {};
              }
              if (Array.isArray(value)) {
                // value is an array of hours
                value.forEach((hourItem) => {
                  const hour = hourItem.hour;
                  if (!dateValueMap[date][hour]) {
                    dateValueMap[date][hour] = {};
                  }
                  dateValueMap[date][hour][res.name] = hourItem.value;
                });
              } else {
                // value is a single number
                dateValueMap[date][res.name] = value;
              }
            });
          });

          Object.keys(dateValueMap).forEach((date) => {
            if (table.groupByHour) {
              Object.keys(dateValueMap[date]).forEach((hour) => {
                const row = [date, hour, getRowName(subjectList, objectsList, item.subject, item.objects)];
                item.data.forEach((res) => {
                  const value = dateValueMap[date][hour][res.name] || '-';
                  row.push(value);
                });
                wsData.push(row);
              });
            } else {
              const row = [date, getRowName(subjectList, objectsList, item.subject, item.objects)];
              item.data.forEach((res) => {
                const value = dateValueMap[date][res.name] || '-';
                row.push(value);
              });
              wsData.push(row);
            }
          });
        } else {
          // If no date_value, add a single row
          const row = [
            table.startDate || '-',
            getRowName(subjectList, objectsList, item.subject, item.objects),
          ];
          item.data.forEach((res) => {
            row.push(res.value || '-');
          });
          wsData.push(row);
        }

        // Create worksheet and add to workbook
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        let sheetName = `${table.name}_${getRowName(
          subjectList,
          objectsList,
          item.subject,
          item.objects
        )}`;

        // Ensure sheet name does not exceed 31 characters
        if (sheetName.length > 31) {
          sheetName = sheetName.substring(0, 31);
        }

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
    });

    // Save to file
    XLSX.writeFile(wb, 'exported_tables.xlsx');
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        {tables.map((table, tableIndex) => (
          <TableComponent
            key={tableIndex}
            table={table}
            tableIndex={tableIndex}
            subjectList={subjectList}
            objectsList={objectsList}
            hourFields={hourFields}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            selectedOperation={selectedOperation}
            setSelectedOperation={setSelectedOperation}
            formulaInput={formulaInput}
            setFormulaInput={setFormulaInput}
            addRow={addRow}
            addColumn={addColumn}
            deleteRow={deleteRow}
            deleteColumn={deleteColumn}
            updateColumnName={updateColumnName}
            visibleSubTables={visibleSubTables}
            setVisibleSubTables={setVisibleSubTables}
            selectedObjects={selectedObjects}
            setSelectedObjects={setSelectedObjects}
            updateCellOperation={updateCellOperation} // Pass the update function
            allObjects={allObjects}
          />
        ))}

        {/* Submit and Export buttons */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleSubmit}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-1/3 flex items-center justify-center"
          >
            <FaCheckCircle className="mr-2" />
            <span>Отправить</span>
          </button>

          <button
            onClick={exportToExcel}
            className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-1/3 flex items-center justify-center"
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
    </div>
  );
};

export default FormConstructor;

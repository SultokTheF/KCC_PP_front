// FormConstructor.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import Sidebar from "../../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import TableComponent from "./TableComponent";
import useFetchData from './useFetchData';
import { hourFields } from './constants';
import { processTableData, getSubjectName } from './utils';
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

  const [objects, setObjects] = useState([]);

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const response = await axiosInstance.get(endpoints.OBJECTS);
        setObjects(response.data);
      } catch (error) {
        console.error("Error fetching objects:", error);
      }
    };
    fetchObjects();
  }, []);

  // Add a new row (subject) to a specific table
  const addRow = (tableIndex) => {
    const subject = subjectList.find(
      (s) => s.id === parseInt(selectedSubject)
    );

    if (!subject) return;

    setTables((prevTables) =>
      prevTables.map((table, idx) => {
        if (idx === tableIndex) {
          if (!table.tableConfig.find((item) => item.subject === subject.id)) {
            // Get existing columns (data) from first subject
            const existingData =
              table.tableConfig.length > 0 ? table.tableConfig[0].data : [];

            // Create new data for the new subject
            const newData = existingData.map((res) => ({
              ...res,
              subject: subject.id,
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
                  subject: subject.id,
                  data: newData,
                },
              ],
            };
          }
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
      };
    } else if (selectedOperation === "array") {
      newResult = {
        plan: "array",
        name: "Array",
        operation: "array",
        params: [],
        id: uuidv4(),
      };
    }

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

  // Delete a row (subject) from a specific table
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

  // Submit the tables data
  const handleSubmit = async () => {
    setIsSubmitting(true);
  
    // Prepare the data to match the server's expected format, including selected objects
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
            objects: item.selectedObjects || [], // Include selected objects here
            plan: res.plan, // Take plan from the data entry as before
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
        const newTables = tablesData.map(processTableData);
        setTables(newTables);
      }
    } catch (error) {
      console.error("Error submitting data to the server:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  // Function to export tables to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    tables.forEach((table) => {
      table.tableConfig.forEach((item) => {
        const wsData = [];

        // Header row
        const header = ['Дата', 'Субъект', 'Час'];
        item.data.forEach((res) => {
          header.push(res.name);
        });
        wsData.push(header);

        // Data rows
        if (item.data[0]?.date_value?.length > 0) {
          item.data[0].date_value.forEach((dateItem, dateIdx) => {
            dateItem.value.forEach((hourItem, hourIdx) => {
              const row = [
                dateItem.date,
                getSubjectName(subjectList, item.subject),
                hourItem.hour,
              ];
              item.data.forEach((res) => {
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
            getSubjectName(subjectList, item.subject),
            '-',
          ];
          item.data.forEach((res) => {
            row.push(res.value || '-');
          });
          wsData.push(row);
        }

        // Create worksheet and add to workbook
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const sheetName = `${table.name}_${getSubjectName(
          subjectList,
          item.subject
        )}`;
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
            objects={objects}
            setTables={setTables}
          />
        ))}

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleSubmit}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-1/3 flex items-center justify-center"
          >
            <FaCheckCircle className="mr-2" />
            <span>Отправить</span>
          </button>
        </div>

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

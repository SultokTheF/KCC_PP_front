// src/components/FormConstructor/FormConstructor.jsx

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import Sidebar from "../../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import TableComponent from "./TableComponent";

const FormConstructor = () => {
  const { id } = useParams();

  // Operation mappings - simplified to only 'array' and 'formula'
  const operationMappings = {
    array: "Array",
    formula: "Formula",
  };

  const defaultOperations = ["array", "formula"];

  const hourFields = [
    "coefficient",
    "volume",
    "P1",
    "P2",
    "P3",
    "F1",
    "F2",
    "P1_Gen",
    "P2_Gen",
    "P3_Gen",
    "F1_Gen",
    "F2_Gen",
    "EZ_T",
    "EZ_Base_T",
    "EZ_T_ВИЭ",
    "EZ_T_РЭК",
    "Pred_T",
    "Wo_Prov_T",
    "W_Prov_T",
    "BE_T",
    "OD_T",
    "T_Coef",
    "direction",
    "message",
  ];

  // State
  const [tables, setTables] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedOperation, setSelectedOperation] = useState("formula");
  const [formulaInput, setFormulaInput] = useState("");

  // State for showing detailed data (sub-tables)
  const [visibleSubTables, setVisibleSubTables] = useState({});

  // Fetch subjects and initial table data by id
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch subjects
        const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
        setSubjectList(subjectsResponse.data);

        if (subjectsResponse.data.length > 0) {
          setSelectedSubject(subjectsResponse.data[0].id);
        }

        // Fetch table data by id
        const tableResponse = await axiosInstance.get(endpoints.TABLE(id));
        setTablesFromResponse(tableResponse.data);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
      }
    };

    fetchInitialData();
  }, [id]);

  // Set tables data from response
  const setTablesFromResponse = (responseData) => {
    // Assuming responseData is an array of tables
    // If responseData is a single table, wrap it in an array
    const tablesData = Array.isArray(responseData)
      ? responseData
      : [responseData];

    const newTables = tablesData.map((tableData) => {
      const {
        name,
        start_date,
        end_date,
        group_by_date,
        group_by_hour,
        data,
        exclude_holidays,
      } = tableData;

      // Organize data by subject
      const subjectsMap = {};
      (data || []).forEach((result) => {
        if (!subjectsMap[result.subject]) {
          subjectsMap[result.subject] = {
            subject: result.subject,
            data: [],
          };
        }
        subjectsMap[result.subject].data.push({
          ...result,
          // Ensure each result has a unique identifier
          id: Math.random().toString(36).substr(2, 9),
        });
      });

      return {
        name: name || "Без названия",
        startDate: start_date
          ? new Date(
              new Date(start_date).getTime() -
                new Date(start_date).getTimezoneOffset() * 60000
            )
              .toISOString()
              .split("T")[0]
          : new Date().toISOString().split("T")[0],
        endDate: end_date
          ? new Date(
              new Date(end_date).getTime() -
                new Date(end_date).getTimezoneOffset() * 60000
            )
              .toISOString()
              .split("T")[0]
          : new Date().toISOString().split("T")[0],
        groupByDate: group_by_date || false,
        groupByHour: group_by_hour || false,
        excludeHolidays: exclude_holidays || {
          Russia: false,
          Kazakhstan: false,
          Weekend: false,
        },
        tableConfig: Object.values(subjectsMap),
      };
    });

    setTables(newTables);
  };

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
            const existingdata =
              table.tableConfig.length > 0 ? table.tableConfig[0].data : [];

            // Create new data for the new subject
            const newdata = existingdata.map((res) => ({
              ...res,
              subject: subject.id,
              value: null,
              date_value: null,
              // Assign new IDs
              id: Math.random().toString(36).substr(2, 9),
            }));

            return {
              ...table,
              tableConfig: [
                ...table.tableConfig,
                {
                  subject: subject.id,
                  data: newdata,
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
    const operation =
      selectedOperation === "formula" ? "formula" : "array";

    let newResult = null;

    if (selectedOperation === "formula") {
      newResult = {
        plan: "formula",
        name: formulaInput || "Формула",
        operation: formulaInput,
        params: [],
        id: Math.random().toString(36).substr(2, 9),
      };
    } else if (selectedOperation === "array") {
      newResult = {
        plan: "array",
        name: "Array",
        operation: "array",
        params: [],
        id: Math.random().toString(36).substr(2, 9),
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
    // Prepare the data to match the server's expected format
    const finalData = tables.map((table) => ({
      name: table.name, // Include the updated table name
      start_date: table.startDate,
      end_date: table.endDate,
      group_by_date: table.groupByDate,
      group_by_hour: table.groupByHour,
      exclude_holidays: table.excludeHolidays,
      data: table.tableConfig
        .map((item) =>
          item.data.map((res) => ({
            subject: item.subject,
            plan: res.plan,
            name: res.name,
            operation: res.operation,
            params: res.params,
          }))
        )
        .flat(),
    }));

    try {
      // If the server expects a single table, send finalData[0]
      // Otherwise, send the entire finalData array
      const dataToSend = finalData.length === 1 ? finalData[0] : finalData;

      const response = await axiosInstance.put(endpoints.TABLE(id), dataToSend);

      // If successful, fetch the updated table from the server
      if (response.status === 200) {
        const updatedTableResponse = await axiosInstance.get(
          endpoints.TABLE(id)
        );
        setTablesFromResponse(updatedTableResponse.data);
      }
    } catch (error) {
      console.error("Ошибка при отправке данных на сервер:", error);
    }
  };

  // Get subject name by ID
  const getSubjectName = (id) => {
    const subject = subjectList.find((s) => s.id === id);
    return subject ? subject.subject_name : "Неизвестный субъект";
  };

  // Render value function
  const renderValue = (result, key) => {
    if (result.value !== undefined) {
      return result.value !== null ? result.value : "-";
    } else if (result.date_value) {
      // Indicate that data can be shown/hidden
      const isVisible = isSubTableVisible(key);
      return (
        <button
          onClick={() => toggleSubTableVisibility(key)}
          className="text-blue-500 hover:underline"
        >
          {isVisible ? "Скрыть данные" : "Показать данные"}
        </button>
      );
    } else {
      return "-";
    }
  };

  // Toggle sub-table visibility
  const toggleSubTableVisibility = (key) => {
    setVisibleSubTables((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isSubTableVisible = (key) => {
    return visibleSubTables[key];
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
            operationMappings={operationMappings}
            defaultOperations={defaultOperations}
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
            getSubjectName={getSubjectName}
            renderValue={renderValue}
            toggleSubTableVisibility={toggleSubTableVisibility}
            isSubTableVisible={isSubTableVisible}
            visibleSubTables={visibleSubTables}
          />
        ))}

        {/* Submit button */}
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-1/3 flex items-center justify-center"
          >
            <FaCheckCircle className="mr-2" />
            <span>Отправить</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormConstructor;

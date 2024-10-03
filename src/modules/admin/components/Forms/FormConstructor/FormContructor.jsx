import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaTrashAlt, FaPlusCircle, FaCheckCircle } from "react-icons/fa";
import Sidebar from "../../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import FormulaEditor from './FormulaEditor';

const FormConstructor = () => {
  const { id } = useParams();
  

  // Operations and Formulas mappings for display and JSON
  const operationMappings = {
    sum: "Сумма",
    average: "Среднее",
    min: "Минимум",
    max: "Максимум",
    sumif: "Сумма если",
    averageif: "Среднее если",
    countif: "Количество если",
    formula: "Формула",
    other: "Другое",
  };

  const reverseOperationMappings = {
    Сумма: "sum",
    Среднее: "average",
    Минимум: "min",
    Максимум: "max",
    "Сумма если": "sumif",
    "Среднее если": "averageif",
    "Количество если": "countif",
    Формула: "formula",
    Другое: "other",
  };

  const defaultOperations = [
    "sum",
    "average",
    "min",
    "max",
    "sumif",
    "averageif",
    "countif",
    "formula",
    "other",
  ];

  const conditionOperators = [">", "<", ">=", "<=", "==", "!="];

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

  // State for table information (now handling multiple tables)
  const [tables, setTables] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedField, setSelectedField] = useState(hourFields[0]);
  const [selectedOperation, setSelectedOperation] = useState(
    defaultOperations[0]
  );
  const [customOperation, setCustomOperation] = useState("");

  // New state variables for parameters
  const [conditionField, setConditionField] = useState(hourFields[0]);
  const [conditionOperator, setConditionOperator] = useState(">");
  const [conditionValue, setConditionValue] = useState("");
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
      selectedOperation === "other"
        ? customOperation
        : selectedOperation.toUpperCase();

    let newResult = null;

    if (
      selectedOperation === "sumif" ||
      selectedOperation === "averageif" ||
      selectedOperation === "countif"
    ) {
      newResult = {
        plan: selectedField,
        name: operationMappings[selectedOperation] || operation,
        operation: operation,
        params: [
          selectedField,
          conditionField,
          conditionOperator + conditionValue,
        ],
        id: Math.random().toString(36).substr(2, 9),
      };
    } else if (selectedOperation === "formula") {
      newResult = {
        plan: "formula",
        name: formulaInput || "Формула",
        operation: formulaInput,
        params: [],
        id: Math.random().toString(36).substr(2, 9),
      };
    } else {
      newResult = {
        plan: selectedField,
        name: operationMappings[selectedOperation] || operation,
        operation: operation,
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

  const groupDataByDate = (tables) => {
    const groupedData = {};
  
    tables.forEach((table) => {
      table.tableConfig.forEach((item) => {
        item.data.forEach((result) => {
          if (result.date_value && result.date_value.length > 0) {
            result.date_value.forEach((dateItem) => {
              const date = dateItem.date;
              if (!groupedData[date]) {
                groupedData[date] = [];
              }
              groupedData[date].push({
                hour: dateItem.hour, // Assuming there's an hour field
                tableName: table.name,
                value: dateItem.value || "-",
              });
            });
          }
        });
      });
    });
  
    return groupedData;
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

  // Update column name in a specific table
  const updateColumnName = (tableIndex, columnIndex, newName) => {
    setTables((prevTables) =>
      prevTables.map((table, idx) => {
        if (idx === tableIndex) {
          return {
            ...table,
            tableConfig: table.tableConfig.map((item) => {
              const updateddata = item.data.map((res, resIdx) => {
                if (resIdx === columnIndex) {
                  return { ...res, name: newName };
                }
                return res;
              });
              return { ...item, data: updateddata };
            }),
          };
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

  // Function to render hourly data when groupByHour is true
  const renderHourlyArrayTable = (arrayData, label, date, key) => {
    // If arrayData is empty, display a message
    if (!arrayData || arrayData.length === 0) {
      return (
        <div key={`${label}-${date}`} className="my-6">
          <h3 className="text-lg font-bold mb-2">{label}</h3>
          <div>Нет данных для отображения</div>
        </div>
      );
    }

    // Generate row for the day and each hour
    const dayHours = arrayData;

    const rows = (
      <tr key={date}>
        <td className="border px-4 py-2 text-gray-600">{date}</td>
        {dayHours.map((hourValue, hourIndex) => (
          <td key={hourIndex} className="border px-4 py-2 text-gray-600">
            {hourValue.value || 0} {/* Display 0 if value is null */}
          </td>
        ))}
      </tr>
    );

    return (
      <div key={`${label}-${date}-${key}`} className="my-6">
        <h3 className="text-lg font-bold mb-2">
          {label} - {date}
          <button
            onClick={() => toggleSubTableVisibility(key)}
            className="ml-4 text-blue-500 hover:underline"
          >
            Скрыть данные
          </button>
        </h3>

        {/* Apply the scrolling and width restrictions */}
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
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    );
  };

  // State and functions to control visibility of sub-tables
  const toggleSubTableVisibility = (key) => {
    setVisibleSubTables((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isSubTableVisible = (key) => {
    return visibleSubTables[key];
  };

  // Updated renderValue function
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

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        {tables.map((table, tableIndex) => (
          <div key={tableIndex} className="mb-10">
            {/* Table Name Input */}
            <div className="mb-6">
              <label className="block text-gray-700 mb-1">
                Название таблицы:
              </label>
              <input
                type="text"
                value={table.name}
                onChange={(e) =>
                  setTables((prevTables) =>
                    prevTables.map((t, idx) =>
                      idx === tableIndex ? { ...t, name: e.target.value } : t
                    )
                  )
                }
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
                    setTables((prevTables) =>
                      prevTables.map((t, idx) =>
                        idx === tableIndex
                          ? { ...t, startDate: e.target.value }
                          : t
                      )
                    )
                  }
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
                  onChange={(e) =>
                    setTables((prevTables) =>
                      prevTables.map((t, idx) =>
                        idx === tableIndex
                          ? { ...t, endDate: e.target.value }
                          : t
                      )
                    )
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
                    setTables((prevTables) =>
                      prevTables.map((t, idx) =>
                        idx === tableIndex
                          ? { ...t, groupByDate: e.target.checked }
                          : t
                      )
                    )
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
                    setTables((prevTables) =>
                      prevTables.map((t, idx) =>
                        idx === tableIndex
                          ? { ...t, groupByHour: e.target.checked }
                          : t
                      )
                    )
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
                      setTables((prevTables) =>
                        prevTables.map((t, idx) =>
                          idx === tableIndex
                            ? {
                                ...t,
                                excludeHolidays: {
                                  ...t.excludeHolidays,
                                  Russia: e.target.checked,
                                },
                              }
                            : t
                        )
                      )
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
                      setTables((prevTables) =>
                        prevTables.map((t, idx) =>
                          idx === tableIndex
                            ? {
                                ...t,
                                excludeHolidays: {
                                  ...t.excludeHolidays,
                                  Kazakhstan: e.target.checked,
                                },
                              }
                            : t
                        )
                      )
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
                      setTables((prevTables) =>
                        prevTables.map((t, idx) =>
                          idx === tableIndex
                            ? {
                                ...t,
                                excludeHolidays: {
                                  ...t.excludeHolidays,
                                  Weekend: e.target.checked,
                                },
                              }
                            : t
                        )
                      )
                    }
                    className="mr-2"
                  />
                  Выходные
                </label>
              </div>
            </div>

            {/* Add row section */}
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

            {/* Add column section */}
            <div className="mb-6 space-x-4 flex items-center">
              <label className="block text-gray-700">Выберите план:</label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {hourFields.map((field, index) => (
                  <option key={index} value={field}>
                    {field}
                  </option>
                ))}
                <option value="formula">Формула</option>
                <option value="array">Массив</option>
                <option value="where">WHERE IF</option>
              </select>

              <label className="block text-gray-700">Выберите операцию:</label>
              <select
                value={selectedOperation}
                onChange={(e) => setSelectedOperation(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {defaultOperations.map((operation, index) => (
                  <option key={index} value={operation}>
                    {operationMappings[operation]}
                  </option>
                ))}
              </select>

              {selectedOperation === "sumif" ||
              selectedOperation === "averageif" ||
              selectedOperation === "countif" ? (
                <div className="flex items-center space-x-4">
                  <label className="block text-gray-700">Поле условия:</label>
                  <select
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {hourFields.map((field, index) => (
                      <option key={index} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>

                  <label className="block text-gray-700">Оператор:</label>
                  <select
                    value={conditionOperator}
                    onChange={(e) => setConditionOperator(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {conditionOperators.map((operator, index) => (
                      <option key={index} value={operator}>
                        {operator}
                      </option>
                    ))}
                  </select>

                  <label className="block text-gray-700">Значение:</label>
                  <input
                    type="text"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : selectedOperation === "formula" ? (
                <div className="flex items-center space-x-4">
                  <label className="block text-gray-700">Введите формулу:</label>
                  <FormulaEditor value={formulaInput} onChange={setFormulaInput} />
                </div>
              ) : selectedOperation === "other" && (
                <input
                  type="text"
                  placeholder="Введите название операции"
                  value={customOperation}
                  onChange={(e) => setCustomOperation(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              )}

              <button
                onClick={() => addColumn(tableIndex)}
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1"
              >
                <FaPlusCircle className="mr-1" />
                <span>Добавить колонку</span>
              </button>
            </div>

            {/* Main Table structure */}
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

            {/* Render detailed data for each result with date_value */}
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
                      renderHourlyArrayTable(
                        dateItem.value,
                        label,
                        dateItem.date,
                        key
                      )
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

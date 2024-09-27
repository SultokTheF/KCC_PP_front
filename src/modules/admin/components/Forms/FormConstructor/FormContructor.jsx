import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaTrashAlt, FaPlusCircle, FaCheckCircle } from "react-icons/fa";
import Sidebar from "../../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

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
    "coefficient", "volume",
    "P1", "P2", "P3", "F1", "F2",
    "P1_Gen", "P2_Gen", "P3_Gen", "F1_Gen", "F2_Gen",
    "EZ_T", "EZ_Base_T",
    "EZ_T_ВИЭ", "EZ_T_РЭК",
    "Pred_T", "Wo_Prov_T", "W_Prov_T",
    "BE_T", "OD_T",
    "T_Coef",
    "direction",
    "message"
  ];

  // State for table information
  const [tableName, setTableName] = useState("");
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [tableConfig, setTableConfig] = useState([]);
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
        setTableFromResponse(tableResponse.data);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
      }
    };

    fetchInitialData();
  }, [id]);

  // Set table data and name from response
  const setTableFromResponse = (tableData) => {
    setTableName(tableData.name || "Без названия");
    setStartDate(
      tableData.start_date
        ? new Date(new Date(tableData.start_date).getTime() - new Date(tableData.start_date).getTimezoneOffset() * 60000).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setEndDate(
      tableData.end_date
        ? new Date(new Date(tableData.end_date).getTime() - new Date(tableData.end_date).getTimezoneOffset() * 60000).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
    );

    const updatedTableConfig = tableData.data.map((row) => ({
      subject: row.subject,
      columns: row.columns.map((col) => ({
        plan: col.plan,
        operation: col.operation,
        params: col.params || [],
        value: col.value,
        array_value: col.array_value || [], // Catch the array values if present
      })),
    }));

    setTableConfig(updatedTableConfig);
  };

  // Function to render hourly data when the plan is "array" and operation is "other"
  const renderHourlyArrayTable = (arrayData, label) => {
    let rows = [];
    let currentDay = new Date(startDate);

    // Iterate through the array in chunks of 24 (representing each hour of the day)
    for (let i = 0; i < arrayData.length; i += 24) {
      const dayHours = arrayData.slice(i, i + 24);

      // Generate row for the day and each hour
      rows.push(
        <tr key={i}>
          <td className="border px-4 py-2 text-gray-600">
            {currentDay.toISOString().split("T")[0]}
          </td>
          {dayHours.map((hourValue, hourIndex) => (
            <td key={hourIndex} className="border px-4 py-2 text-gray-600">
              {hourValue || 0} {/* Display 0 if value is null */}
            </td>
          ))}
        </tr>
      );

      // Move to the next day
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return (
      <div key={label} className="my-6">
        <h3 className="text-lg font-bold mb-2">{label}</h3>

        {/* Apply the scrolling and width restrictions */}
        <div className="overflow-x-auto">
          <table className="min-w-full max-w-[1200px] bg-gray-100 border border-gray-300">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left text-gray-700 border-b">
                  Дата
                </th>
                {Array.from({ length: 24 }, (_, i) => (
                  <th key={i} className="px-2 py-1 text-left text-gray-700 border-b">
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

  // Add a new row
  const addRow = () => {
    const subject = subjectList.find(
      (s) => s.id === parseInt(selectedSubject)
    );
    const newRow = {
      subject: subject.id,
      columns:
        tableConfig.length > 0
          ? tableConfig[0].columns.map((col) => ({
            plan: col.plan,
            operation: col.operation,
            params: col.params || [],
            value: 0,
            array_value: [], // Initialize array_value as an empty array for new columns
          }))
          : [], // Initialize empty columns if no previous rows
    };

    setTableConfig((prev) => [...prev, newRow]);
  };

  // Add a new column
  const addColumn = () => {
    let newColumn = null;
    const operation =
      selectedOperation === "other"
        ? customOperation
        : selectedOperation.toUpperCase();

    if (
      selectedOperation === "sumif" ||
      selectedOperation === "averageif" ||
      selectedOperation === "countif"
    ) {
      newColumn = {
        plan: selectedField,
        operation,
        params: [
          selectedField,
          conditionField,
          conditionOperator + conditionValue,
        ],
        value: 0,
        array_value: [], // Initialize array_value as an empty array
      };
    } else if (selectedOperation === "formula") {
      newColumn = {
        plan: "formula",
        operation: formulaInput,
        value: 0,
        array_value: [], // Initialize array_value as an empty array
      };
    } else {
      newColumn = {
        plan: selectedField,
        operation,
        value: 0,
        array_value: [], // Initialize array_value as an empty array
      };
    }

    setTableConfig((prev) =>
      prev.map((row) => ({
        ...row,
        columns: [...row.columns, newColumn],
      }))
    );
  };

  // Delete a row
  const deleteRow = (index) => {
    setTableConfig((prev) => prev.filter((_, i) => i !== index));
  };

  // Delete a column
  const deleteColumn = (index) => {
    setTableConfig((prev) =>
      prev.map((row) => ({
        ...row,
        columns: row.columns.filter((_, i) => i !== index),
      }))
    );
  };

  // Submit the table data
  const handleSubmit = async () => {
    const finalData = {
      start_date: startDate,
      end_date: endDate,
      data: tableConfig.map((row) => ({
        subject: row.subject,
        columns: row.columns.map((col) => ({
          name: "sadsa",
          plan: col.plan,
          operation: col.operation,
          params: col.params, // Assuming params is an array of strings
          value: col.value,
        })),
      })),
    };

    try {
      const response = await axiosInstance.put(endpoints.TABLE(id), finalData);

      // If successful, fetch the updated table from the server
      if (response.status === 200) {
        const updatedTableResponse = await axiosInstance.get(endpoints.TABLE(id));
        setTableFromResponse(updatedTableResponse.data);
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

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          {tableName}
        </h1>

        {/* Global Date Inputs */}
        <div className="flex space-x-6 mb-6">
          <div className="w-1/2">
            <label className="block text-gray-700 mb-1">Дата начала</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-1/2">
            <label className="block text-gray-700 mb-1">Дата окончания</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
            />
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
            onClick={addRow}
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
              <input
                type="text"
                placeholder="Например: IF(SUM(F1) > 100, SUM(F1) * 2, 0)"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 w-96"
              />
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
            onClick={addColumn}
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
                {tableConfig.length > 0 &&
                  tableConfig[0].columns.map((col, index) => (
                    <th
                      key={index}
                      className="px-4 py-2 text-left text-gray-700 font-semibold border-b"
                    >
                      {col.plan === "formula" ? (
                        `Формула (${col.operation})`
                      ) : col.params && col.params.length > 0 ? (
                        `${col.plan} (${operationMappings[col.operation] || col.operation
                        } ${col.params.join(" ")})`
                      ) : (
                        `${col.plan} (${operationMappings[col.operation] || col.operation
                        })`
                      )}
                      <button
                        className="ml-2 text-red-500 hover:text-red-700 flex items-center"
                        onClick={() => deleteColumn(index)}
                      >
                        <FaTrashAlt className="mr-1" />
                        <span>Удалить</span>
                      </button>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {tableConfig.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="border px-4 py-2 text-gray-600">
                    {getSubjectName(row.subject)}
                    <button
                      className="ml-2 text-red-500 hover:text-red-700 flex items-center"
                      onClick={() => deleteRow(rowIndex)}
                    >
                      <FaTrashAlt className="mr-1" />
                      <span>Удалить</span>
                    </button>
                  </td>

                  {row.columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className="border px-4 py-2 text-gray-600"
                    >
                      {/* If array_value exists, skip rendering in this main table */}
                      {col.array_value.length > 0 ? null : col.value !== null ? col.value : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        {/* Render separate tables for array_value columns */}
        {tableConfig.map((row, rowIndex) =>
          row.columns.map((col, colIndex) =>
            col.array_value.length > 0 ? (
              renderHourlyArrayTable(col.array_value, `${col.plan} (${col.operation})`, col.subject)
            ) : null
          )
        )}

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

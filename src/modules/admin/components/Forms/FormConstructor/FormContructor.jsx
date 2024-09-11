import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Import useParams for getting URL params
import { FaTrashAlt, FaPlusCircle, FaCheckCircle } from "react-icons/fa";
import Sidebar from "../../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

const FormConstructor = () => {
  const { id } = useParams(); // Get id from URL

  // Operations and Formulas mappings for display and JSON
  const operationMappings = {
    sum: "Сумма",
    avg: "Среднее",
    min: "Минимум",
    max: "Максимум",
    other: "Другое",
    formula: "Формула"
  };

  const reverseOperationMappings = {
    Сумма: "sum",
    Среднее: "avg",
    Минимум: "min",
    Максимум: "max",
    Другое: "other",
    Формула: "formula"
  };

  const hourFields = [
    "P1", "P2", "P3", "F1", "F2", "P1_Gen", "P2_Gen", "P3_Gen", "F1_Gen", "F2_Gen",
    "BE_Up", "BE_Down", "OD_Up", "OD_Down", "EZ_T", "EZ_Base_T", "Ind_Prov_T", "BE_T", "OD_T",
    "Ind_T", "Prov_T", "EZ_T_ВИЭ", "T_Coef", "Money_V1", "Money_V2", "Money_V3", "Money_V4"
  ];

  const defaultOperations = ["sum", "avg", "min", "max", "other"];

  // State for table information
  const [tableName, setTableName] = useState(""); // To hold the table's name
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tableConfig, setTableConfig] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedField, setSelectedField] = useState(hourFields[0]);
  const [selectedOperation, setSelectedOperation] = useState(defaultOperations[0]);
  const [customOperation, setCustomOperation] = useState("");

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
  }, [id]); // Re-fetch when id changes

  // Set table data and name from response
  const setTableFromResponse = (tableData) => {
    setTableName(tableData.name || "Без названия"); // Set the table's name
    setStartDate(tableData.start_date ? tableData.start_date : new Date().toISOString().split("T")[0]);
    setEndDate(tableData.end_date ? tableData.end_date : new Date().toISOString().split("T")[0]);

    const updatedTableConfig = tableData.data.map((row) => ({
      subject: row.subject,
      columns: row.columns.map((col) => ({
        plan: col.plan,
        operation: col.operation,
        value: col.value
      }))
    }));

    setTableConfig(updatedTableConfig);
  };

  // Add a new row
  const addRow = () => {
    const subject = subjectList.find((s) => s.id === parseInt(selectedSubject));
    const newRow = {
      subject: subject.id,
      columns: tableConfig.length > 0
        ? tableConfig[0].columns.map(col => ({
          plan: col.plan,
          operation: col.operation,
          value: 0
        }))
        : [], // Copy the existing column structure with default value 0
    };

    setTableConfig((prev) => [...prev, newRow]);
  };

  // Add a new column
  const addColumn = () => {
    const operation = selectedOperation === "other" ? customOperation : selectedOperation.toLowerCase();
    const newColumn = { plan: selectedField, operation, value: 0 };

    setTableConfig((prev) =>
      prev.map((row) => ({
        ...row,
        columns: [...row.columns, newColumn], // Add the new column to each row
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
        columns: row.columns.filter((_, i) => i !== index)
      }))
    );
  };

  // Handle dynamic changes between operation and plan fields
  useEffect(() => {
    if (selectedOperation === "other") {
      setSelectedField("formula");
    }
  }, [selectedOperation]);

  useEffect(() => {
    if (selectedField === "formula") {
      setSelectedOperation("other");
    }
  }, [selectedField]);

  // Submit the table data
  const handleSubmit = async () => {
    const finalData = {
      start_date: startDate,
      end_date: endDate,
      data: tableConfig.map(row => ({
        subject: row.subject,
        columns: row.columns.map(col => ({
          plan: col.plan,
          operation: reverseOperationMappings[col.operation] || col.operation, // Use the mapping or fallback to original operation
          value: col.value
        }))
      }))
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
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">{tableName}</h1>

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

          {selectedOperation === "other" && (
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

        {/* Table structure */}
        {/* Table structure */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-200 shadow-md">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-gray-700 font-semibold border-b">Субъекты</th>
                {tableConfig.length > 0 &&
                  tableConfig[0].columns.map((col, index) => (
                    <th key={index} className="px-4 py-2 text-left text-gray-700 font-semibold border-b">
                      {/* Conditional display logic for column headers */}
                      {col.plan === "formula" ? (
                        // If it's a formula, display Формула (operation)
                        `Формула (${col.operation})`
                      ) : (
                        // Otherwise, display plan and its corresponding operation
                        `${col.plan} (${operationMappings[col.operation] || col.operation})`
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
                    <td key={colIndex} className="border px-4 py-2 text-gray-600">
                      {col.value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

import React, { useState, useEffect } from "react";
import { axiosInstance, endpoints } from "../../../../services/apiConfig";
import Sidebar from "../Sidebar/Sidebar";
import Select from "react-select";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import * as XLSX from "xlsx";
import { useAuth } from "../../../../hooks/useAuth";

pdfMake.vfs = pdfFonts.pdfMake
  ? pdfFonts.pdfMake.vfs
  : pdfFonts.vfs
  ? pdfFonts.vfs
  : pdfFonts;

const History = () => {
  const [history, setHistory] = useState([]);
  const [objects, setObjects] = useState([]);
  const [users, setUsers] = useState([]);

  const { user } = useAuth();

  // New state variables for logs modal
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsStartDate, setLogsStartDate] = useState("");
  const [logsEndDate, setLogsEndDate] = useState("");
  const [logsCount, setLogsCount] = useState(0); // State to hold count of logs

  // Set initial dates to current date
  const currentDate = new Date().toISOString().split("T")[0];

  const [filters, setFilters] = useState({
    action: [],
    plan: [],
    sumPlanMin: "",
    sumPlanMax: "",
    dateDayStart: currentDate,
    dateDayEnd: currentDate,
    dateStart: currentDate, // New filter
    dateEnd: currentDate, // New filter
    timeStart: "",
    timeEnd: "",
    userRole: [],
    object: [],
  });

  const actionOptions = [
    { value: "create", label: "Создание" },
    { value: "update", label: "Редактирование" },
    // { value: "delete", label: "Удаление" },
  ];

  const planOptions = [
    { value: "P1", label: "P1" },
    { value: "P2", label: "P2" },
    { value: "P3", label: "P3" },
    { value: "F1", label: "F1" },
    { value: "F2", label: "F2" },
    // Add more plans if necessary
  ];

  const userRoleOptions = [
    { value: "ADMIN", label: "Администратор" },
    { value: "USER", label: "Пользователь" },
    { value: "DISPATCHER", label: "Диспетчер" },
    // Add more roles if necessary
  ];

  const userRoleMapping = {
    ADMIN: "Администратор",
    USER: "Пользователь",
    DISPATCHER: "Диспетчер",
  };

  // Fetch objects
  const fetchObjects = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get("/api/objects/", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { user: user.id },
      });
      setObjects(response.data);
    } catch (error) {
      console.error("Error fetching objects:", error);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(endpoints.USERS);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchObjects();
  }, []);

  const objectOptions = objects.map((obj) => ({
    value: obj.id,
    label: obj.object_name,
  }));

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const params = {};

      if (filters.action.length > 0) params.action = filters.action.join(",");
      if (filters.plan.length > 0) params.plan = filters.plan.join(",");
      if (filters.sumPlanMin) params.sum_plan_min = filters.sumPlanMin;
      if (filters.sumPlanMax) params.sum_plan_max = filters.sumPlanMax;
      if (filters.dateDayStart) params.date_day_start = filters.dateDayStart;
      if (filters.dateDayEnd) params.date_day_end = filters.dateDayEnd;
      if (filters.dateStart) params.date_start = filters.dateStart; // New
      if (filters.dateEnd) params.date_end = filters.dateEnd; // New
      if (filters.timeStart) params.time_start = filters.timeStart;
      if (filters.timeEnd) params.time_end = filters.timeEnd;
      if (filters.userRole.length > 0)
        params.user_role = filters.userRole.join(",");
      if (filters.object.length > 0) params.object = filters.object.join(",");

      const historyResponse = await axiosInstance.get("/api/history/", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: params,
      });
      setHistory(historyResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleMultiSelectChange = (selectedOptions, { name }) => {
    const value = selectedOptions
      ? selectedOptions.map((opt) => opt.value)
      : [];
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const formatDateTime = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const exportPDF = () => {
    // Prepare the data
    const data = history.map((historyItem) => {
      const objectName =
        objects.find((obj) => obj.id === historyItem.object)?.object_name ||
        "Неизвестно";

      const { date, time } = formatDateTime(historyItem.date, historyItem.time);

      // Get user role based on email
      const user = users.find((u) => u.email === historyItem.user);
      const userRole = user
        ? userRoleMapping[user.role] || "Неизвестно"
        : "Неизвестно";

      return [
        historyItem.user,
        userRole,
        historyItem.action,
        historyItem.plan,
        historyItem.sum_plan,
        historyItem.date_day,
        date,
        time,
        objectName,
      ];
    });

    const docDefinition = {
      content: [
        {
          table: {
            headerRows: 1,
            widths: [
              "auto",
              "auto",
              "auto",
              "auto",
              "auto",
              "auto",
              "auto",
              "auto",
              "auto",
            ],
            body: [
              [
                "Пользователь",
                "Роль",
                "Действие",
                "План",
                "Сумма плана",
                "Дата дня",
                "Дата",
                "Время",
                "Объект",
              ],
              ...data,
            ],
          },
        },
      ],
      defaultStyle: {
        font: "Roboto",
        fontSize: 8,
      },
    };

    pdfMake.createPdf(docDefinition).download("history.pdf");
  };

  // Export to Excel function
  const exportExcel = () => {
    // Prepare the data
    const data = history.map((historyItem) => {
      const objectName =
        objects.find((obj) => obj.id === historyItem.object)?.object_name ||
        "Неизвестно";

      const { date, time } = formatDateTime(historyItem.date, historyItem.time);

      // Get user role based on email
      const user = users.find((u) => u.email === historyItem.user);
      const userRole = user
        ? userRoleMapping[user.role] || "Неизвестно"
        : "Неизвестно";

      return {
        Пользователь: historyItem.user,
        Роль: userRole,
        Действие: historyItem.action,
        План: historyItem.plan,
        "Сумма плана": historyItem.sum_plan,
        "Дата дня": historyItem.date_day,
        Дата: date,
        Время: time,
        Объект: objectName,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "History");

    XLSX.writeFile(workbook, "history.xlsx");
  };

  // Fetch logs function with start_date and end_date
  const fetchLogs = async (start_date, end_date) => {
    setIsLoadingLogs(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const params = {
        start_date: start_date,
        end_date: end_date,
      };
      const response = await axiosInstance.get(endpoints.GET_LOGS, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: params,
      });
      setLogs(response.data);
      setLogsCount(response.data.length); // Set the count of logs
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogsCount(0); // Reset count on error
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Open logs modal
  const openLogsModal = () => {
    // Initialize modal dates with current filter dates
    setLogsStartDate(filters.dateDayStart);
    setLogsEndDate(filters.dateDayEnd);
    setIsLogsModalOpen(true);
    fetchLogs(filters.dateDayStart, filters.dateDayEnd);
  };

  // Close logs modal
  const closeLogsModal = () => {
    setIsLogsModalOpen(false);
    setLogs([]);
    setLogsCount(0);
  };

  // Handle date changes in the modal
  const handleLogsDateChange = (e) => {
    const { name, value } = e.target;
    if (name === "logsStartDate") {
      setLogsStartDate(value);
    } else if (name === "logsEndDate") {
      setLogsEndDate(value);
    }
  };

  // Handle fetching logs with updated dates
  const handleFetchLogs = () => {
    // Validate dates
    if (logsStartDate > logsEndDate) {
      alert("Начальная дата не может быть позже конечной даты.");
      return;
    }
    fetchLogs(logsStartDate, logsEndDate);
  };

  // Function to download logs as TXT
  const downloadLogsAsTxt = () => {
    if (logs.length === 0) {
      alert("Нет логов для скачивания.");
      return;
    }

    // Convert logs to a readable string format
    const logsText = logs
      .map((log, index) => {
        return `Log ${index + 1}:
funcName: ${log.funcName}
log_message: ${log.log_message}
ip_address: ${log.ip_address}
level: ${log.level}
lineno: ${log.lineno}
logger: ${log.logger}
message: ${log.message}
pathname: ${log.pathname}
timestamp: ${log.timestamp}
user: ${log.user}
----------------------------------------`;
      })
      .join("\n");

    // Create a Blob from the logs text
    const blob = new Blob([logsText], { type: "text/plain;charset=utf-8" });

    // Create a link to download the Blob as a file
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${logsStartDate}_to_${logsEndDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="container mx-auto p-4">
        {/* Filters Section */}
        <div className="mb-4 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Фильтры</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Actions Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Действия
              </label>
              <Select
                isMulti
                name="action"
                options={actionOptions}
                classNamePrefix="select"
                onChange={handleMultiSelectChange}
                value={actionOptions.filter((opt) =>
                  filters.action.includes(opt.value)
                )}
                placeholder="Выберите действия"
              />
            </div>
            {/* Plan Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                План
              </label>
              <Select
                isMulti
                name="plan"
                options={planOptions}
                classNamePrefix="select"
                onChange={handleMultiSelectChange}
                value={planOptions.filter((opt) =>
                  filters.plan.includes(opt.value)
                )}
                placeholder="Выберите план"
              />
            </div>
            {/* User Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Роль пользователя
              </label>
              <Select
                isMulti
                name="userRole"
                options={userRoleOptions}
                classNamePrefix="select"
                onChange={handleMultiSelectChange}
                value={userRoleOptions.filter((opt) =>
                  filters.userRole.includes(opt.value)
                )}
                placeholder="Выберите роль"
              />
            </div>
            {/* Object Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Объекты
              </label>
              <Select
                isMulti
                name="object"
                options={objectOptions}
                classNamePrefix="select"
                onChange={handleMultiSelectChange}
                value={objectOptions.filter((opt) =>
                  filters.object.includes(opt.value)
                )}
                placeholder="Выберите объекты"
              />
            </div>
            {/* Sum Plan Min Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сумма плана (мин)
              </label>
              <input
                type="number"
                name="sumPlanMin"
                value={filters.sumPlanMin}
                onChange={handleInputChange}
                placeholder="Минимальная сумма"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                      focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {/* Sum Plan Max Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сумма плана (макс)
              </label>
              <input
                type="number"
                name="sumPlanMax"
                value={filters.sumPlanMax}
                onChange={handleInputChange}
                placeholder="Максимальная сумма"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                      focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {/* Date Day Start Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Начало операционного периода
              </label>
              <input
                type="date"
                name="dateDayStart"
                value={filters.dateDayStart}
                onChange={handleInputChange}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                      focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {/* Date Day End Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Конец операционного периода
              </label>
              <input
                type="date"
                name="dateDayEnd"
                value={filters.dateDayEnd}
                onChange={handleInputChange}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                      focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {/* Date Start Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата начала действия операции
              </label>
              <input
                type="date"
                name="dateStart"
                value={filters.dateStart}
                onChange={handleInputChange}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {/* Date End Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата завершения действия операции
              </label>
              <input
                type="date"
                name="dateEnd"
                value={filters.dateEnd}
                onChange={handleInputChange}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {/* Time Start Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время начала действия операции
              </label>
              <input
                type="number"
                min="1"
                max="24"
                name="timeStart"
                value={filters.timeStart}
                onChange={handleInputChange}
                placeholder="1-24"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                      focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {/* Time End Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время завершения действия операции
              </label>
              <input
                type="number"
                min="1"
                max="24"
                name="timeEnd"
                value={filters.timeEnd}
                onChange={handleInputChange}
                placeholder="1-24"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                      focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Export and Show Logs Buttons */}
        <div className="flex justify-end mb-4 space-x-2">
          <button
            onClick={exportPDF}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Экспортировать в PDF
          </button>
          <button
            onClick={exportExcel}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Экспортировать в Excel
          </button>
          <button
            onClick={openLogsModal}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Показать логи
          </button>
        </div>

        {/* Table Section */}
        <div className="h-[calc(100vh-9rem)] overflow-y-auto">
          <table className="table-auto w-full bg-white rounded shadow-md">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Пользователь</th>
                <th className="px-4 py-2 border">Роль</th>
                <th className="px-4 py-2 border">Действие</th>
                <th className="px-4 py-2 border">План</th>
                <th className="px-4 py-2 border">Сумма плана</th>
                <th className="px-4 py-2 border">Дата дня</th>
                <th className="px-4 py-2 border">Дата</th>
                <th className="px-4 py-2 border">Время</th>
                <th className="px-4 py-2 border">Объект</th>
                <th className="px-4 py-2 border">IP</th>
              </tr>
            </thead>
            <tbody>
              {history.map((historyItem, index) => {
                const objectName =
                  objects.find((obj) => obj.id === historyItem.object)
                    ?.object_name || "Неизвестно";

                const { date, time } = formatDateTime(
                  historyItem.date,
                  historyItem.time
                );

                // Get user role based on email
                const user = users.find((u) => u.email === historyItem.user);
                const userRole = user
                  ? userRoleMapping[user.role] || "Неизвестно"
                  : "Неизвестно";

                return (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border px-4 py-2">{users.find(u => u.id === historyItem.user).email}</td>
                    <td className="border px-4 py-2">{users.find(u => u.id === historyItem.user).role}</td>
                    <td className="border px-4 py-2">{historyItem.action}</td>
                    <td className="border px-4 py-2">{historyItem.plan}</td>
                    <td className="border px-4 py-2">{historyItem.sum_plan}</td>
                    <td className="border px-4 py-2">{historyItem.date_day}</td>
                    <td className="border px-4 py-2">{date}</td>
                    <td className="border px-4 py-2">{time}</td>
                    <td className="border px-4 py-2">{objectName}</td>
                    <td className="border px-4 py-2">
                      {historyItem.ip ??
                        "89.218.87.98"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Logs Modal */}
        {isLogsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 rounded-lg shadow-lg overflow-y-auto max-h-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Логи</h2>
                <button
                  onClick={closeLogsModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Date Filters within Modal */}
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-medium mb-2">Фильтр по датам</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Начало периода
                    </label>
                    <input
                      type="date"
                      name="logsStartDate"
                      value={logsStartDate}
                      onChange={handleLogsDateChange}
                      className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                            focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Конец периода
                    </label>
                    <input
                      type="date"
                      name="logsEndDate"
                      value={logsEndDate}
                      onChange={handleLogsDateChange}
                      className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm
                            focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleFetchLogs}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Применить
                  </button>
                </div>
              </div>

              {/* Logs Count Display */}
              <div className="mb-4">
                {isLoadingLogs ? (
                  <div className="flex justify-center items-center">
                    <svg
                      className="animate-spin h-8 w-8 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <div className="text-center text-lg font-medium">
                    Всего логов за выбранный период: {logsCount}
                  </div>
                )}
              </div>

              {/* Download Logs Button */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={downloadLogsAsTxt}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Скачать Логи
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeLogsModal}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

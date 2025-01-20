import React, { useState, useEffect } from "react";
import { axiosInstance, endpoints } from "../../../../services/apiConfig";
import Sidebar from "../Sidebar/Sidebar";
import Select from "react-select";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { useAuth } from '../../../../hooks/useAuth';
import * as XLSX from "xlsx";

pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs ? pdfFonts.vfs : pdfMake.vfs;

const History = () => {
  const [history, setHistory] = useState([]);
  const [objects, setObjects] = useState([]);
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  // Set initial dates to current date
  const currentDate = new Date().toISOString().split("T")[0];

  const [filters, setFilters] = useState({
    action: [],
    plan: [],
    sumPlanMin: "",
    sumPlanMax: "",
    dateDayStart: currentDate,
    dateDayEnd: currentDate,
    dateStart: currentDate,
    dateEnd: currentDate,
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

  // Fetch objects assigned to the user
  const fetchObjects = async () => {
    try {
      const response = await axiosInstance.get("/api/objects/", {
        params: {
          user: user.id,
        },
      });
      setObjects(response.data);
    } catch (error) {
      console.error("Error fetching objects:", error);
    }
  };

  // Fetch all users
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
    if (objects.length === 0) {
      // Wait until objects are loaded
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      const params = {};

      if (filters.action.length > 0) params.action = filters.action.join(",");
      if (filters.plan.length > 0) params.plan = filters.plan.join(",");
      if (filters.sumPlanMin) params.sum_plan_min = filters.sumPlanMin;
      if (filters.sumPlanMax) params.sum_plan_max = filters.sumPlanMax;
      if (filters.dateDayStart) params.date_day_start = filters.dateDayStart;
      if (filters.dateDayEnd) params.date_day_end = filters.dateDayEnd;
      if (filters.dateStart) params.date_start = filters.dateStart;
      if (filters.dateEnd) params.date_end = filters.dateEnd;
      if (filters.timeStart) params.time_start = filters.timeStart;
      if (filters.timeEnd) params.time_end = filters.timeEnd;
      if (filters.userRole.length > 0)
        params.user_role = filters.userRole.join(",");

      // If no objects are selected, include all objects assigned to the user
      if (filters.object.length === 0) {
        params.object = objects.map((obj) => obj.id).join(",");
      } else {
        params.object = filters.object.join(",");
      }

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
  }, [filters, objects]);

  const handleMultiSelectChange = (selectedOptions, { name }) => {
    const value = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
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
      const userObj = users.find((u) => u.email === historyItem.user);
      const userRole = userObj
        ? userRoleMapping[userObj.role] || "Неизвестно"
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
      const userObj = users.find((u) => u.email === historyItem.user);
      const userRole = userObj
        ? userRoleMapping[userObj.role] || "Неизвестно"
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

        {/* Export Buttons */}
        <div className="flex justify-end mb-4">
          <button
            onClick={exportPDF}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Экспортировать в PDF
          </button>
          <button
            onClick={exportExcel}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Экспортировать в Excel
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
                const userObj = users.find((u) => u.email === historyItem.user);
                const userRole = userObj
                  ? userRoleMapping[userObj.role] || "Неизвестно"
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;

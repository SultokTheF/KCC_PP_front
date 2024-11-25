import React, { useState, useEffect, useRef } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import * as XLSX from "xlsx";

const timeIntervals = [
  "00 - 01",
  "01 - 02",
  "02 - 03",
  "03 - 04",
  "04 - 05",
  "05 - 06",
  "06 - 07",
  "07 - 08",
  "08 - 09",
  "09 - 10",
  "10 - 11",
  "11 - 12",
  "12 - 13",
  "13 - 14",
  "14 - 15",
  "15 - 16",
  "16 - 17",
  "17 - 18",
  "18 - 19",
  "19 - 20",
  "20 - 21",
  "21 - 22",
  "22 - 23",
  "23 - 00",
];

const CombinedTable = ({
  selectedData,
  setSelectedData,
  subjectsList,
  objectsList,
  selectedDate,
}) => {
  // State variables
  const [subjectHoursList, setSubjectHoursList] = useState([]);
  const [objectHoursMap, setObjectHoursMap] = useState({});

  const [subjectStatusMap, setSubjectStatusMap] = useState({});
  const [objectStatusMap, setObjectStatusMap] = useState({});
  const [loadingSubjectStatuses, setLoadingSubjectStatuses] = useState(true);
  const [loadingObjectStatuses, setLoadingObjectStatuses] = useState(true);
  const [subjectStatusError, setSubjectStatusError] = useState(null);
  const [objectStatusError, setObjectStatusError] = useState(null);

  // State for local hour plan
  const [localHourPlan, setLocalHourPlan] = useState(
    initializeDefaultHourPlan()
  );

  // State for P2 message display
  const [showMessageCol, setShowMessageCol] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const fileInputRef = useRef(null);

  // Initialize default hour plan with 24 entries
  function initializeDefaultHourPlan() {
    return Array(24)
      .fill()
      .map((_, index) => ({
        hour: index + 1,
        P1: 0,
        P1_Gen: 0,
        P2: 0,
        P2_Gen: 0,
        P3: 0,
        P3_Gen: 0,
        F1: 0,
        F1_Gen: 0,
        F2: 0,
        F2_Gen: 0,
        coefficient: 0,
        volume: 0,
        P2_message: "",
        message: "",
      }));
  }

  // Effect to auto-dismiss warningMessage after 3 seconds
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  // Fetch subject statuses when selectedDate or subjectsList changes
  useEffect(() => {
    if (subjectsList.length > 0 && selectedData.selectedSubject) {
      fetchSubjectStatuses();
    }
  }, [selectedDate, subjectsList, selectedData.selectedSubject]);

  // Fetch object statuses when selectedSubject, selectedDate, or objectsList changes
  useEffect(() => {
    if (selectedData.selectedSubject) {
      fetchObjectStatuses();
    } else {
      setObjectStatusMap({});
    }
  }, [selectedDate, selectedData.selectedSubject, objectsList]);

  // Fetch subject hours when selectedDate or selectedSubject changes
  useEffect(() => {
    if (selectedData.selectedSubject) {
      fetchSubjectHours();
      fetchAllObjectHours();
    } else {
      setSubjectHoursList([]);
      setLocalHourPlan(initializeDefaultHourPlan());
      setObjectHoursMap({});
    }
  }, [selectedDate, selectedData.selectedSubject]);

  // Fetch hours based on whether subject or object is selected
  const fetchSubjectHours = async () => {
    try {
      const response = await axiosInstance.get(endpoints.HOURS, {
        params: { day: selectedDate, sub: selectedData.selectedSubject },
      });
      const subjectHours = response.data || [];
      setSubjectHoursList(subjectHours);

      // Initialize localHourPlan with subjectHours data or default values
      const initialHourPlan = initializeDefaultHourPlan().map(
        (hourPlan, index) => {
          const hourData = subjectHours.find((hour) => hour.hour === index + 1);
          return {
            ...hourPlan,
            P1: hourData?.P1 || 0,
            P1_Gen: hourData?.P1_Gen || 0,
            P2: hourData?.P2 || 0,
            P2_Gen: hourData?.P2_Gen || 0,
            P3: hourData?.P3 || 0,
            P3_Gen: hourData?.P3_Gen || 0,
            F1: hourData?.F1 || 0,
            F1_Gen: hourData?.F1_Gen || 0,
            F2: hourData?.F2 || 0,
            F2_Gen: hourData?.F2_Gen || 0,
            coefficient: hourData?.coefficient || 0,
            volume: hourData?.volume || 0,
            P2_message: hourData?.P2_message || "",
            message: hourData?.message || "",
          };
        }
      );
      setLocalHourPlan(initialHourPlan);
    } catch (error) {
      console.error("Error fetching subject hours:", error);
      setSubjectHoursList([]);
      setLocalHourPlan(initializeDefaultHourPlan());
    }
  };

  const fetchAllObjectHours = async () => {
    try {
      const objectsForSubject = objectsList.filter(
        (object) => object.subject === selectedData.selectedSubject
      );
      const objectHoursPromises = objectsForSubject.map((object) =>
        axiosInstance
          .get(endpoints.HOURS, {
            params: { day: selectedDate, obj: object.id },
          })
          .then((response) => ({
            id: object.id,
            hours: response.data || [],
          }))
      );

      const objectHoursArray = await Promise.all(objectHoursPromises);

      const newObjectHoursMap = {};
      objectHoursArray.forEach(({ id, hours }) => {
        newObjectHoursMap[id] = hours;
      });

      setObjectHoursMap(newObjectHoursMap);
    } catch (error) {
      console.error("Error fetching object hours:", error);
      setObjectHoursMap({});
    }
  };

  // Fetch statuses
  const getPlanStatus = async (date, params) => {
    try {
      const response = await axiosInstance.get(endpoints.GET_STATUS, {
        params: {
          date,
          ...params,
        },
      });
      return response.data || {};
    } catch (error) {
      console.error(`Error fetching status:`, error);
      return {};
    }
  };

  const fetchSubjectStatuses = async () => {
    setLoadingSubjectStatuses(true);
    setSubjectStatusError(null);

    const newSubjectStatusMap = {};

    try {
      const subjectStatusPromises = subjectsList.map((subject) =>
        getPlanStatus(selectedDate, { subject: subject.id }).then(
          (statuses) => ({
            id: subject.id,
            statuses,
          })
        )
      );

      const subjectStatuses = await Promise.all(subjectStatusPromises);

      subjectStatuses.forEach(({ id, statuses }) => {
        newSubjectStatusMap[id] = statuses;
      });

      setSubjectStatusMap(newSubjectStatusMap);
    } catch (error) {
      console.error("Error fetching subject statuses:", error);
    } finally {
      setLoadingSubjectStatuses(false);
    }
  };

  const fetchObjectStatuses = async () => {
    setLoadingObjectStatuses(true);
    setObjectStatusError(null);

    const newObjectStatusMap = {};

    try {
      const objectsForSubject = objectsList.filter(
        (object) => object.subject === selectedData.selectedSubject
      );
      const objectStatusPromises = objectsForSubject.map((object) =>
        getPlanStatus(selectedDate, { object: object.id }).then((statuses) => ({
          id: object.id,
          statuses,
        }))
      );

      const objectStatuses = await Promise.all(objectStatusPromises);

      objectStatuses.forEach(({ id, statuses }) => {
        newObjectStatusMap[id] = statuses;
      });

      setObjectStatusMap(newObjectStatusMap);
    } catch (error) {
      console.error("Error fetching object statuses:", error);
    } finally {
      setLoadingObjectStatuses(false);
    }
  };

  const generateStatusDisplayComponents = (statuses) => {
    if (!statuses || Object.keys(statuses).length === 0) {
      return "Нет данных";
    }

    const planKeys = ["P1_Status", "P2_Status", "P3_Status", "F1_Status"];

    const planAbbreviations = {
      P1_Status: "П1",
      P2_Status: "П2",
      P3_Status: "П3",
      F1_Status: "Ф",
    };

    const statusColors = {
      COMPLETED: "text-green-500",
      IN_PROGRESS: "text-orange-500",
      OUTDATED: "text-red-500",
      NOT_STARTED: "text-black", // default color
    };

    return (
      <div>
        {planKeys.map((key) => {
          const planStatus = statuses[key];
          const planName = planAbbreviations[key];
          const colorClass = statusColors[planStatus] || "";
          return (
            <span key={key} className={`${colorClass} mx-1`}>
              {planName}
            </span>
          );
        })}
      </div>
    );
  };

  const selectedSubject = subjectsList.find(
    (subject) => subject.id === selectedData.selectedSubject
  );
  const selectedObject = objectsList.find(
    (object) => object.id === selectedData.selectedObject
  );

  const subjectHourPlan = localHourPlan || [];

  // Functions for P2 calculations and handling changes
  const calculateP2 = (index, P1) => {
    const coefficient = localHourPlan[index]?.coefficient || 0;
    const volume = localHourPlan[index]?.volume || 0;
    const P2 = P1 * coefficient + volume;
    return P2.toFixed(2);
  };

  const handleCoefficientChange = (index, value) => {
    const updatedHourPlan = [...localHourPlan];
    updatedHourPlan[index].coefficient = parseFloat(value) || 0;
    setLocalHourPlan(updatedHourPlan);
  };

  const handleVolumeChange = (index, value) => {
    const updatedHourPlan = [...localHourPlan];
    updatedHourPlan[index].volume = parseInt(value, 10) || 0;
    setLocalHourPlan(updatedHourPlan);
  };

  const handleMessagesChange = (index, value) => {
    const updatedHourPlan = [...localHourPlan];
    updatedHourPlan[index].message = value;
    setLocalHourPlan(updatedHourPlan);
  };

  const handleDisapprove = () => {
    setShowMessageCol(true);
  };

  const handleCancel = () => {
    setShowMessageCol(false);
  };

  const handleFullExport = () => {
    // Subject Table Headers
    const subjectTableHeaders = [
      "Time",
      "P1",
      ...(selectedSubject?.subject_type === "ЭПО" ? ["P1_Gen"] : []),
      "P2",
      ...(selectedSubject?.subject_type === "ЭПО" ? ["P2_Gen"] : []),
      "P3",
      ...(selectedSubject?.subject_type === "ЭПО" ? ["P3_Gen"] : []),
      "F1",
      ...(selectedSubject?.subject_type === "ЭПО" ? ["F1_Gen"] : []),
      "F2",
      ...(selectedSubject?.subject_type === "ЭПО" ? ["F2_Gen"] : []),
      "Coefficient",
      "Volume",
      "P2_Message",
      ...(showMessageCol ? ["Message"] : []),
    ];

    // Prepare subject table data
    const subjectTableData = [
      subjectTableHeaders,
      ...timeIntervals.map((time, index) => {
        const hourData = localHourPlan[index] || {};
        return [
          time,
          hourData.P1 || 0,
          ...(selectedSubject?.subject_type === "ЭПО" ? [hourData.P1_Gen || 0] : []),
          hourData.P2 || 0,
          ...(selectedSubject?.subject_type === "ЭПО" ? [hourData.P2_Gen || 0] : []),
          hourData.P3 || 0,
          ...(selectedSubject?.subject_type === "ЭПО" ? [hourData.P3_Gen || 0] : []),
          hourData.F1 || 0,
          ...(selectedSubject?.subject_type === "ЭПО" ? [hourData.F1_Gen || 0] : []),
          hourData.F2 || 0,
          ...(selectedSubject?.subject_type === "ЭПО" ? [hourData.F2_Gen || 0] : []),
          hourData.coefficient || 0,
          hourData.volume || 0,
          hourData.P2_message || "",
          ...(showMessageCol ? [hourData.message || ""] : []),
        ];
      }),
    ];

    // Prepare objects data
    const objectsData = objectsList
      .filter((object) => object.subject === selectedData.selectedSubject)
      .map((object) => {
        const objectHours = objectHoursMap[object.id] || [];
        const objectTableHeaders = [
          "Time",
          "P1",
          ...(object?.object_type === "ЭПО" ? ["P1_Gen"] : []),
          "P2",
          ...(object?.object_type === "ЭПО" ? ["P2_Gen"] : []),
          "P3",
          ...(object?.object_type === "ЭПО" ? ["P3_Gen"] : []),
          "F1",
          ...(object?.object_type === "ЭПО" ? ["F1_Gen"] : []),
          "F2",
          ...(object?.object_type === "ЭПО" ? ["F2_Gen"] : []),
          "P2_Message",
        ];
        const objectTableData = [
          objectTableHeaders,
          ...timeIntervals.map((time, index) => {
            const hourData =
              objectHours.find((hour) => hour.hour === index + 1) || {};
            return [
              time,
              hourData.P1 || 0,
              ...(object?.object_type === "ЭПО" ? [hourData.P1_Gen || 0] : []),
              hourData.P2 || 0,
              ...(object?.object_type === "ЭПО" ? [hourData.P2_Gen || 0] : []),
              hourData.P3 || 0,
              ...(object?.object_type === "ЭПО" ? [hourData.P3_Gen || 0] : []),
              hourData.F1 || 0,
              ...(object?.object_type === "ЭПО" ? [hourData.F1_Gen || 0] : []),
              hourData.F2 || 0,
              ...(object?.object_type === "ЭПО" ? [hourData.F2_Gen || 0] : []),
              hourData.P2_message || "",
            ];
          }),
        ];
        return {
          objectName: object.object_name,
          data: objectTableData,
        };
      });

    // Combine tables into one sheet
    const combinedData = [
      ["Subject:", selectedSubject.subject_name],
      [],
      ["Subject Table"],
      ...subjectTableData,
      [],
    ];

    objectsData.forEach((objectData) => {
      combinedData.push(["Object:", objectData.objectName]);
      combinedData.push([]);
      combinedData.push(...objectData.data);
      combinedData.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(combinedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Full Export");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Save file
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `full_export_${selectedDate}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleApprove = async () => {
    // Console log as per requirement
    console.log({
      call: "calculate",
      subject: selectedData.selectedSubject,
      date: selectedDate,
      plan: {
        volume: localHourPlan.map((hour) => hour.volume),
        coefficient: localHourPlan.map((hour) => hour.coefficient),
      },
    });

    try {
      const response = await axiosInstance.post(endpoints.CALCULATE_P2, {
        call: "calculate",
        subject: selectedData.selectedSubject,
        date: selectedDate,
        plan: {
          volume: localHourPlan.map((hour) => hour.volume),
          coefficient: localHourPlan.map((hour) => hour.coefficient),
        },
      });

      if (response.status === 200 || response.status === 201) {
        setWarningMessage("План успешно утвержден.");
        fetchSubjectHours(); // added
        fetchAllObjectHours();
        fetchObjectStatuses();
        fetchSubjectStatuses();
      } else {
        setWarningMessage("Ошибка при утверждении плана.");
      }
    } catch (error) {
      console.error("Error approving plan:", error);
      setWarningMessage("Ошибка при утверждении плана.");
    }
  };

  const handleSave = async () => {
    // Console log as per requirement
    console.log({
      call: "save",
      subject: selectedData.selectedSubject,
      date: selectedDate,
      plan: {
        volume: localHourPlan.map((hour) => hour.volume),
        coefficient: localHourPlan.map((hour) => hour.coefficient),
      },
    });

    try {
      const response = await axiosInstance.post(endpoints.CALCULATE_P2, {
        call: "save",
        subject: selectedData.selectedSubject,
        date: selectedDate,
        plan: {
          volume: localHourPlan.map((hour) => hour.volume),
          coefficient: localHourPlan.map((hour) => hour.coefficient),
        },
      });

      if (response.status === 200 || response.status === 201) {
        setWarningMessage("Данные успешно сохранены.");
        fetchSubjectHours(); // added
        fetchAllObjectHours();
        fetchObjectStatuses();
        fetchSubjectStatuses();
      } else {
        setWarningMessage("Ошибка при сохранении данных.");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      setWarningMessage("Ошибка при сохранении данных.");
    }
  };

  const handleImportFromFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        file.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setWarningMessage(
          "Неподдерживаемый формат файла. Пожалуйста, выберите файл .xlsx."
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Check if the headers are correct
          const headers = jsonData[0];
          if (
            !headers ||
            headers.length < 3 ||
            headers[0] !== "Hour" ||
            headers[1] !== "Coefficient" ||
            headers[2] !== "Volume"
          ) {
            setWarningMessage(
              "Неверный формат файла. Ожидаются заголовки: Hour, Coefficient, Volume."
            );
            return;
          }

          parseExcelData(jsonData);
        } catch (error) {
          console.error("Error reading Excel file:", error);
          setWarningMessage("Ошибка при чтении файла.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const parseExcelData = (rows) => {
    const updatedHourPlan = initializeDefaultHourPlan();

    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header row
      if (row.length < 3) {
        console.warn(`Row ${index + 1} is incomplete and will be skipped.`);
        return;
      }
      const [hourStr, coefficientStr, volumeStr] = row;
      const hour = parseInt(hourStr, 10);
      const coefficient = parseFloat(coefficientStr);
      const volume = parseInt(volumeStr, 10);
      const idx = hour - 1; // Assuming hours are from 1 to 24
      if (isNaN(hour) || isNaN(coefficient) || isNaN(volume)) {
        console.warn(
          `Row ${index + 1} contains invalid data and will be skipped.`
        );
        return;
      }
      if (idx >= 0 && idx < 24) {
        updatedHourPlan[idx].coefficient = coefficient;
        updatedHourPlan[idx].volume = volume;
      } else {
        console.warn(
          `Hour ${hour} in row ${
            index + 1
          } is out of range and will be skipped.`
        );
      }
    });

    setLocalHourPlan(updatedHourPlan);
    setWarningMessage("Данные успешно импортированы.");
  };

  const handleExport = () => {
    const exportData = [
      ["Hour", "Coefficient", "Volume"],
      ...localHourPlan.map((hourData) => [
        hourData.hour,
        hourData.coefficient,
        hourData.volume,
      ]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Coefficients_Volumes");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coefficients_volumes_${
      selectedSubject?.subject_name || "subject"
    }_${selectedDate}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Display Warning Message */}
      {warningMessage && (
        <div className="mb-4 p-2 bg-yellow-200 text-yellow-800 rounded">
          {warningMessage}
        </div>
      )}

      {/* Subject and Object Status Tables */}
      <div className="mb-4">
        {/* Subject Status Table */}
        {subjectsList.length > 0 && (
          <table className="w-full text-sm text-center text-gray-500 mb-3">
            <thead className="text-xs text-gray-700 uppercase bg-gray-300">
              <tr>
                <th>Субъект</th>
                {subjectsList.map((subject) => (
                  <th
                    key={subject.id}
                    className={`cursor-pointer ${
                      selectedData.selectedSubject === subject.id
                        ? "bg-blue-500 text-white"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedData({
                        ...selectedData,
                        selectedSubject: subject.id,
                        selectedObject: null, // Reset selectedObject when subject changes
                      })
                    }
                  >
                    {subject.subject_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border" scope="row">
                  Статус
                </td>
                {subjectsList.map((subject) => (
                  <td key={subject.id} className="border">
                    {loadingSubjectStatuses
                      ? "Загрузка..."
                      : subjectStatusError
                      ? subjectStatusError
                      : generateStatusDisplayComponents(
                          subjectStatusMap[subject.id]
                        )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}

        {/* Objects Status Table */}
        {selectedData.selectedSubject && (
          <table className="w-full text-sm text-center text-gray-500 mb-3">
            <thead className="text-xs text-gray-700 uppercase bg-gray-300">
              <tr>
                <th>Объект</th>
                {objectsList
                  .filter(
                    (object) => object.subject === selectedData.selectedSubject
                  )
                  .map((object) => (
                    <th
                      key={object.id}
                      className={`cursor-pointer ${
                        selectedData.selectedObject === object.id
                          ? "bg-blue-500 text-white"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedData({
                          ...selectedData,
                          selectedObject: object.id,
                        })
                      }
                    >
                      {object.object_name}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border" scope="row">
                  Статус
                </td>
                {objectsList
                  .filter(
                    (object) => object.subject === selectedData.selectedSubject
                  )
                  .map((object) => (
                    <td key={object.id} className="border">
                      {loadingObjectStatuses
                        ? "Загрузка..."
                        : objectStatusError
                        ? objectStatusError
                        : generateStatusDisplayComponents(
                            objectStatusMap[object.id]
                          )}
                    </td>
                  ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Save and Approve Buttons */}
      <div className="flex justify-end space-x-2 mt-4">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          onClick={handleFullExport}
        >
          Экспорт полного отчета
        </button>
      </div>

      {/* Tables Side by Side */}
      <div className="flex flex-col md:flex-row">
        {/* Subject Data Table */}
        <div className="w-full md:w-1/2 mr-0 md:mr-2 mb-4 md:mb-0">
          {/* Hidden File Input */}
          <input
            type="file"
            accept=".xlsx"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Subject Table */}
          {selectedData.selectedSubject && (
            <table className="w-full text-sm text-center text-gray-500 mb-3">
              {/* Table Head */}
              <thead className="text-xs text-gray-700 uppercase bg-gray-300">
                <tr>
                  <th className="w-[50px]">Время</th>
                  <th className="w-[100px]">П1</th>
                  {selectedSubject?.subject_type === "ЭПО" && (
                    <th className="w-[100px]">ГП1</th>
                  )}
                  <th className="w-[100px]">Коэффициент</th>
                  <th className="w-[100px]">Объем</th>
                  <th className="w-[100px]">П2</th>
                  <th className="w-[150px]">Сообщение П2</th>
                  {selectedSubject?.subject_type === "ЭПО" && (
                    <th className="w-[100px]">ГП2</th>
                  )}
                  {showMessageCol && <th className="w-[150px]">Сообщение</th>}
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {timeIntervals.map((time, index) => {
                  const subjectHourData = localHourPlan[index] || {};

                  const P1 = subjectHourData.P1 || 0;
                  const P1_Gen = subjectHourData.P1_Gen || 0;
                  const P2_message = subjectHourData.P2_message || "";

                  const P2 =
                    subjectHourData.P2 != null && subjectHourData.P2 !== 0
                      ? subjectHourData.P2
                      : calculateP2(index, P1);

                  return (
                    <tr key={time}>
                      <td className="border">{time}</td>
                      {/* Subject Data */}
                      <td className="border">{P1}</td>
                      {selectedSubject?.subject_type === "ЭПО" && (
                        <td className="border">{P1_Gen}</td>
                      )}
                      <td className="border">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={localHourPlan[index]?.coefficient || 0}
                          onChange={(e) =>
                            handleCoefficientChange(index, e.target.value)
                          }
                          className="w-full text-center rounded"
                        />
                      </td>
                      <td className="border">
                        <input
                          type="number"
                          value={localHourPlan[index]?.volume || 0}
                          onChange={(e) =>
                            handleVolumeChange(index, e.target.value)
                          }
                          className="w-full text-center rounded"
                        />
                      </td>
                      <td className="border">{P2}</td>
                      <td
                        className={`border ${
                          P2_message
                            ? P2_message === "Успешно!"
                              ? "bg-green-100"
                              : "bg-red-100"
                            : ""
                        }`}
                      >
                        {P2_message || ""}
                      </td>
                      {selectedSubject?.subject_type === "ЭПО" && (
                        <td className="border">{subjectHourData.P2_Gen || 0}</td>
                      )}
                      {showMessageCol && (
                        <td className="border">
                          <input
                            type="text"
                            value={localHourPlan[index]?.message || ""}
                            onChange={(e) =>
                              handleMessagesChange(index, e.target.value)
                            }
                            className="w-full text-center rounded"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Save and Approve Buttons */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              onClick={handleSave}
            >
              Сохранить
            </button>

            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              onClick={handleApprove}
            >
              Утвердить
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              onClick={handleExport}
            >
              Экспорт
            </button>

            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              onClick={handleImportFromFile}
            >
              Импорт из файла
            </button>
          </div>

          {/* Message Input for Disapprove */}
          {showMessageCol && (
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                onClick={() => setWarningMessage("Сообщение отправлено!")}
              >
                Отправить
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                onClick={handleCancel}
              >
                Отмена
              </button>
            </div>
          )}
        </div>

        {/* Object Data Table */}
        <div className="w-full md:w-1/2 ml-0 md:ml-2">
          {/* Always display the Object Table if an object is selected */}
          {selectedData.selectedObject && (
            <table className="w-full text-sm text-center text-gray-500 mb-3">
              {/* Table Head */}
              <thead className="text-xs text-gray-700 uppercase bg-gray-300">
                <tr>
                  {/* <th className="w-[50px]">Время</th> */}
                  <th>П1</th>
                  {selectedObject?.object_type === "ЭПО" && <th>ГП1</th>}
                  <th>Объем</th>
                  <th>П2</th>
                  {selectedObject?.object_type === "ЭПО" && <th>ГП2</th>}
                  <th>П3</th>
                  {selectedObject?.object_type === "ЭПО" && <th>ГП3</th>}
                  <th>Ф</th>
                  {selectedObject?.object_type === "ЭПО" && <th>Гф</th>}
                  <th>Сообщение П2</th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {timeIntervals.map((time, index) => {
                  const objectHourData =
                    objectHoursMap[selectedData.selectedObject]?.find(
                      (hour) => hour.hour === index + 1
                    ) || {};

                  return (
                    <tr key={time}>
                      {/* <td className="border">{time}</td> */}
                      <td className="border">{objectHourData.P1 || 0}</td>
                      {selectedObject?.object_type === "ЭПО" && (
                        <td className="border">{objectHourData.P1_Gen || 0}</td>
                      )}
                      <td className="border">{objectHourData.volume || 0}</td>
                      <td className="border">{objectHourData.P2 || 0}</td>
                      {selectedObject?.object_type === "ЭПО" && (
                        <td className="border">{objectHourData.P2_Gen || 0}</td>
                      )}
                      <td className="border">{objectHourData.P3 || 0}</td>
                      {selectedObject?.object_type === "ЭПО" && (
                        <td className="border">{objectHourData.P3_Gen || 0}</td>
                      )}
                      <td className="border">{objectHourData.F1 || 0}</td>
                      {selectedObject?.object_type === "ЭПО" && (
                        <td className="border">{objectHourData.F1_Gen || 0}</td>
                      )}
                      <td
                        className={`border ${
                          objectHourData.P2_message
                            ? objectHourData.P2_message === "Успешно!"
                              ? "bg-green-100"
                              : "bg-red-100"
                            : ""
                        }`}
                      >
                        {objectHourData.P2_message || ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Save and Approve Buttons */}
          <div className="flex justify-end space-x-2 mt-4"></div>
        </div>
      </div>
    </div>
  );
};

export default CombinedTable;

import React, { useState, useEffect, useRef } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import * as XLSX from "xlsx";

// 24-hour labels
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

// Default plan for 24 hours
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
      coefficient: 1,
      volume: 0,
      coefficient_Gen: 1,
      volume_Gen: 0,
      P2_message: "",
      P2_Gen_message: "",
      message: "",
    }));
}

const CombinedTable = ({
  selectedData,
  setSelectedData,
  subjectsList,
  objectsList,
  selectedDate,
}) => {
  // ─────────────────────────────────────────────────────────────────────────────
  //  State
  // ─────────────────────────────────────────────────────────────────────────────
  const [subjectHoursList, setSubjectHoursList] = useState([]);
  const [objectHoursMap, setObjectHoursMap] = useState({});

  const [subjectStatusMap, setSubjectStatusMap] = useState({});
  const [objectStatusMap, setObjectStatusMap] = useState({});
  const [loadingSubjectStatuses, setLoadingSubjectStatuses] = useState(true);
  const [loadingObjectStatuses, setLoadingObjectStatuses] = useState(true);
  const [subjectStatusError, setSubjectStatusError] = useState(null);
  const [objectStatusError, setObjectStatusError] = useState(null);

  // Local hour plan for the selected subject
  const [localHourPlan, setLocalHourPlan] = useState(
    initializeDefaultHourPlan()
  );

  // Show/hide "Message" column (for disapproval)
  const [showMessageCol, setShowMessageCol] = useState(false);

  // Info / warning messages
  const [warningMessage, setWarningMessage] = useState("");

  // File input refs for normal import & GP1 import
  const fileInputRef = useRef(null);
  const fileInputRefGP1 = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────────
  //  Effects
  // ─────────────────────────────────────────────────────────────────────────────
  // Auto-dismiss warning after 3 seconds
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  // Fetch statuses, hours, etc. based on current selection
  useEffect(() => {
    if (subjectsList.length > 0 && selectedData.selectedSubject) {
      fetchSubjectStatuses();
    }
  }, [selectedDate, subjectsList, selectedData.selectedSubject]);

  useEffect(() => {
    if (selectedData.selectedSubject) {
      fetchObjectStatuses();
    } else {
      setObjectStatusMap({});
    }
  }, [selectedDate, selectedData.selectedSubject, objectsList]);

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

  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch logic
  // ─────────────────────────────────────────────────────────────────────────────
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
      console.error("Error fetching status:", error);
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

  const fetchSubjectHours = async () => {
    try {
      const response = await axiosInstance.get(endpoints.HOURS, {
        params: { day: selectedDate, sub: selectedData.selectedSubject },
      });
      const subjectHours = response.data || [];
      setSubjectHoursList(subjectHours);

      // Build localHourPlan from the fetched hours
      const initialHourPlan = initializeDefaultHourPlan().map((row, idx) => {
        const hourData = subjectHours.find((h) => h.hour === idx + 1);
        return {
          ...row,
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
          coefficient: hourData?.coefficient ?? 1,
          volume: hourData?.volume || 0,
          coefficient_Gen: hourData?.coefficient_Gen ?? 1,
          volume_Gen: hourData?.volume_Gen || 0,
          P2_message: hourData?.P2_message || "",
          P2_Gen_message: hourData?.P2_Gen_message || "",
          message: hourData?.message || "",
        };
      });
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
        (obj) => obj.subject === selectedData.selectedSubject
      );
      const objectHoursPromises = objectsForSubject.map(async (object) => {
        try {
          const response = await axiosInstance.get(endpoints.HOURS, {
            params: { day: selectedDate, obj: object.id },
          });
          return { id: object.id, hours: response.data || [] };
        } catch (error) {
          console.error(
            `Error fetching object hours for object ${object.id}:`,
            error
          );
          return { id: object.id, hours: [] };
        }
      });

      const objectHoursArray = await Promise.all(objectHoursPromises);
      const newObjectHoursMap = {};
      objectHoursArray.forEach(({ id, hours }) => {
        newObjectHoursMap[id] = hours;
      });
      setObjectHoursMap(newObjectHoursMap);
    } catch (error) {
      console.error("Error fetching all object hours:", error);
      setObjectHoursMap({});
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Utility / Display
  // ─────────────────────────────────────────────────────────────────────────────
  const generateStatusDisplayComponents = (statuses, isCombined, is_res) => {
    if (!statuses || Object.keys(statuses).length === 0) {
      return "Нет данных";
    }
    if (isCombined) {
      // Combined mode: show one label per plan, green only if both statuses are "STARTED"
      const plans = ["P1", "P2", "P3", "F1"];
      return (
        <div>
          {plans.map((plan) => {
            const mainStatus = statuses[`${plan}_Status`];
            const genStatus = statuses[`${plan}_Gen_Status`];
            let colorClass = "";
            if (mainStatus === "COMPLETED" && genStatus === "COMPLETED") {
              colorClass = "text-green-500";
            } else {
              const originalMapping = {
                COMPLETED: "text-black",
                IN_PROGRESS: "text-orange-500",
                OUTDATED: "text-red-500",
                NOT_STARTED: "text-black",
              };
              colorClass = originalMapping[mainStatus] || "";
            }
            return (
              <span key={plan} className={`${colorClass} mx-1`}>
                {plan === "F1" ? "Ф" : plan === "P1" ? "П1" : plan === "P2" ? "П2" : "П3"}
              </span>
            );
          })}
        </div>
      );
    } else if (is_res) {
      const plans = ["P1", "P2", "P3", "F1"];
      return (
        <div>
          {plans.map((plan) => {
            const mainStatus = statuses[`${plan}_Gen_Status`];
            let colorClass = "";
            if (mainStatus === "COMPLETED") {
              colorClass = "text-green-500";
            } else {
              const originalMapping = {
                COMPLETED: "text-black",
                IN_PROGRESS: "text-orange-500",
                OUTDATED: "text-red-500",
                NOT_STARTED: "text-black",
              };
              colorClass = originalMapping[mainStatus] || "";
            }
            return (
              <span key={plan} className={`${colorClass} mx-1`}>
                {plan === "F1" ? "Ф" : plan === "P1" ? "П1" : plan === "P2" ? "П2" : "П3"}
              </span>
            );
          })}
        </div>
      );
    } else {
      // For CONSUMER/РЭК types, do not show Gen statuses—only display the regular statuses.
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
        NOT_STARTED: "text-black",
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
    }
  };

  const selectedSubject = subjectsList.find(
    (sub) => sub.id === selectedData.selectedSubject
  );
  const selectedObject = objectsList.find(
    (obj) => obj.id === selectedData.selectedObject
  );

  // Determine if generation (“ГП”) columns should be shown (for subjects)
  const showGenColumns =
    selectedSubject?.subject_type !== "CONSUMER" &&
    selectedSubject?.subject_type !== "РЭК";

  // Calculation functions used in the table
  const calculateP2 = (index, P1) => {
    const c = localHourPlan[index]?.coefficient || 0;
    const v = localHourPlan[index]?.volume || 0;
    return (P1 * c + v).toFixed(2);
  };

  const calculateP2Gen = (index, P1_Gen) => {
    const cGen = localHourPlan[index]?.coefficient_Gen || 0;
    const vGen = localHourPlan[index]?.volume_Gen || 0;
    return (P1_Gen * cGen + vGen).toFixed(2);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Handlers: local hour plan changes
  // ─────────────────────────────────────────────────────────────────────────────
  const handleCoefficientChange = (index, value) => {
    const updated = [...localHourPlan];
    updated[index].coefficient = value === "" ? "" : parseFloat(value);
    setLocalHourPlan(updated);
  };

  const handleCoefficientGenChange = (index, value) => {
    const updated = [...localHourPlan];
    updated[index].coefficient_Gen = value === "" ? "" : parseFloat(value);
    setLocalHourPlan(updated);
  };

  const handleVolumeChange = (index, value) => {
    const updated = [...localHourPlan];
    updated[index].volume = value === "" ? "" : parseInt(value, 10);
    setLocalHourPlan(updated);
  };

  const handleVolumeGenChange = (index, value) => {
    const updated = [...localHourPlan];
    updated[index].volume_Gen = value === "" ? "" : parseInt(value, 10);
    setLocalHourPlan(updated);
  };

  const handleMessagesChange = (index, value) => {
    const updated = [...localHourPlan];
    updated[index].message = value;
    setLocalHourPlan(updated);
  };

  const handleDisapprove = () => {
    setShowMessageCol(true);
  };
  const handleCancel = () => {
    setShowMessageCol(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  File Import/Export for subject => Coefficient / Volume
  // ─────────────────────────────────────────────────────────────────────────────
  const handleImportFromFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (
      file.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setWarningMessage("Пожалуйста, выберите файл .xlsx");
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

        // Check headers
        const headers = jsonData[0];
        if (
          !headers ||
          headers.length < 3 ||
          headers[0] !== "Hour" ||
          headers[1] !== "Coefficient" ||
          headers[2] !== "Volume"
        ) {
          setWarningMessage(
            "Неверный формат. Ожидаются заголовки: Hour, Coefficient, Volume."
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
  };

  const parseExcelData = (rows) => {
    const updated = initializeDefaultHourPlan();
    rows.forEach((row, idx) => {
      if (idx === 0) return; // skip header
      const [hourStr, coefStr, volStr] = row;
      const hour = parseInt(hourStr, 10);
      const coefficient = parseFloat(coefStr);
      const volume = parseInt(volStr, 10);
      const i = hour - 1;
      if (
        !isNaN(hour) &&
        !isNaN(coefficient) &&
        !isNaN(volume) &&
        i >= 0 &&
        i < 24
      ) {
        updated[i].coefficient = coefficient;
        updated[i].volume = volume;
      }
    });
    setLocalHourPlan(updated);
    setWarningMessage("Данные успешно импортированы.");
  };

  const handleExport = () => {
    // Export subject's Coefficient & Volume
    const exportData = [
      ["Hour", "Coefficient", "Volume"],
      ...localHourPlan.map((row) => [row.hour, row.coefficient, row.volume]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Coefficients_Volumes");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blobData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blobData);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coefficients_volumes_${
      selectedSubject?.subject_name || "subject"
    }_${selectedDate}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  File Import/Export for GP1 => Coefficient_Gen / Volume_Gen
  // ─────────────────────────────────────────────────────────────────────────────
  const handleImportFromFileGP1 = () => {
    if (fileInputRefGP1.current) {
      fileInputRefGP1.current.click();
    }
  };
  const handleFileChangeGP1 = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (
      file.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setWarningMessage("Пожалуйста, выберите файл .xlsx для ГП1");
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

        // Validate headers
        const headers = jsonData[0];
        if (
          !headers ||
          headers.length < 3 ||
          headers[0] !== "Hour" ||
          headers[1] !== "Coefficient_Gen" ||
          headers[2] !== "Volume_Gen"
        ) {
          setWarningMessage(
            "Неверный формат. Ожидаются заголовки: Hour, Coefficient_Gen, Volume_Gen."
          );
          return;
        }
        parseGP1ExcelData(jsonData);
      } catch (error) {
        console.error("Error reading Excel file (GP1):", error);
        setWarningMessage("Ошибка при чтении файла ГП1.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseGP1ExcelData = (rows) => {
    const updated = [...localHourPlan];
    rows.forEach((row, idx) => {
      if (idx === 0) return; // skip header
      const [hourStr, coefGenStr, volGenStr] = row;
      const hourIndex = parseInt(hourStr, 10) - 1;
      if (hourIndex >= 0 && hourIndex < 24) {
        updated[hourIndex].coefficient_Gen = parseFloat(coefGenStr) || 0;
        updated[hourIndex].volume_Gen = parseInt(volGenStr, 10) || 0;
      }
    });
    setLocalHourPlan(updated);
    setWarningMessage("Данные ГП1 успешно импортированы.");
  };

  const handleExportGP1 = () => {
    const exportData = [
      ["Hour", "Coefficient_Gen", "Volume_Gen"],
      ...localHourPlan.map((row) => [
        row.hour,
        row.coefficient_Gen,
        row.volume_Gen,
      ]),
    ];
    const worksheetGP1 = XLSX.utils.aoa_to_sheet(exportData);
    const workbookGP1 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbookGP1, worksheetGP1, "GP1_Data");
    const excelBufferGP1 = XLSX.write(workbookGP1, {
      bookType: "xlsx",
      type: "array",
    });
    const blobDataGP1 = new Blob([excelBufferGP1], {
      type: "application/octet-stream",
    });
    const urlGP1 = URL.createObjectURL(blobDataGP1);
    const linkGP1 = document.createElement("a");
    linkGP1.href = urlGP1;
    linkGP1.download = `gp1_data_${selectedDate}.xlsx`;
    linkGP1.click();
    URL.revokeObjectURL(urlGP1);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Plan Actions (Save, Approve, Create, Full Export)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    console.log({
      call: "calculate",
      subject: selectedData.selectedSubject,
      date: selectedDate,
      plan: {
        volume: localHourPlan.map((h) => h.volume),
        coefficient: localHourPlan.map((h) => h.coefficient),
        coefficient_Gen: localHourPlan.map((h) => h.coefficient_Gen),
        volume_Gen: localHourPlan.map((h) => h.volume_Gen),
      },
    });

    try {
      handleSave();
      const response = await axiosInstance.post(endpoints.CALCULATE_P2, {
        call: "calculate",
        subject: selectedData.selectedSubject,
        date: selectedDate,
        plan: {
          volume: localHourPlan.map((h) => h.volume),
          coefficient: localHourPlan.map((h) => h.coefficient),
          coefficient_Gen: localHourPlan.map((h) => h.coefficient_Gen),
          volume_Gen: localHourPlan.map((h) => h.volume_Gen),
        },
      });

      if (response.status === 200 || response.status === 201) {
        setWarningMessage("План успешно утвержден.");
        fetchSubjectHours();
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

  const handleCreate = async () => {
    console.log({
      subject: selectedData.selectedSubject,
      date: selectedDate,
      coefficient: localHourPlan.map((h) => h.coefficient),
      coefficient_Gen: localHourPlan.map((h) => h.coefficient_Gen),
    });

    try {
      const response = await axiosInstance.post(endpoints.DAYS, {
        subject: selectedData.selectedSubject,
        date: selectedDate,
        coefficient: localHourPlan.map((h) => h.coefficient),
        coefficient_Gen: localHourPlan.map((h) => h.coefficient_Gen),
      });

      if (response.status === 200 || response.status === 201) {
        setWarningMessage("План успешно создан/утвержден.");
        fetchSubjectHours();
        fetchAllObjectHours();
        fetchObjectStatuses();
        fetchSubjectStatuses();
      } else {
        setWarningMessage("Ошибка при создании плана.");
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      setWarningMessage("Ошибка при создании плана.");
    }
  };

  const handleSave = async () => {
    console.log({
      call: "save",
      subject: selectedData.selectedSubject,
      date: selectedDate,
      plan: {
        volume: localHourPlan.map((h) => h.volume),
        coefficient: localHourPlan.map((h) => h.coefficient),
        coefficient_Gen: localHourPlan.map((h) => h.coefficient_Gen),
        volume_Gen: localHourPlan.map((h) => h.volume_Gen),
      },
    });

    try {
      const response = await axiosInstance.post(endpoints.CALCULATE_P2, {
        call: "save",
        subject: selectedData.selectedSubject,
        date: selectedDate,
        plan: {
          volume: localHourPlan.map((h) => h.volume),
          coefficient: localHourPlan.map((h) => h.coefficient),
          coefficient_Gen: localHourPlan.map((h) => h.coefficient_Gen),
          volume_Gen: localHourPlan.map((h) => h.volume_Gen),
        },
      });

      if (response.status === 200 || response.status === 201) {
        setWarningMessage("Данные успешно сохранены.");
        fetchSubjectHours();
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

  const handleFullExport = () => {
    // Build subject table export
    const subjectTableHeaders = [
      "Time",
      "П1",
      ...(showGenColumns ? ["ГП1"] : []),
      "Коэффициент",
      ...(showGenColumns ? ["Коэф. Генерации"] : []),
      "Объем",
      ...(showGenColumns ? ["Объем Ген."] : []),
      "П2",
      ...(showGenColumns ? ["ГП2"] : []),
      "Сообщ. П2",
      ...(showGenColumns ? ["Сообщ. П2 Ген."] : []),
      ...(showMessageCol ? ["Сообщение"] : []),
    ];

    const subjectTableData = [
      subjectTableHeaders,
      ...timeIntervals.map((time, idx) => {
        const row = localHourPlan[idx] || {};
        const P1 = row.P1 || 0;
        const p2Val = row.P2 !== 0 ? row.P2 : calculateP2(idx, P1);
        return [
          time,
          P1,
          ...(showGenColumns ? [row.P1_Gen || 0] : []),
          row.coefficient,
          ...(showGenColumns ? [row.coefficient_Gen] : []),
          row.volume,
          ...(showGenColumns ? [row.volume_Gen] : []),
          p2Val,
          ...(showGenColumns
            ? [row.P2_Gen || calculateP2Gen(idx, row.P1_Gen || 0)]
            : []),
          row.P2_message || "",
          ...(showGenColumns ? [row.P2_Gen_message || ""] : []),
          ...(showMessageCol ? [row.message || ""] : []),
        ];
      }),
    ];

    const combinedData = [
      ["Subject:", selectedSubject?.subject_name || "Unknown"],
      [],
      ["Subject Table"],
      ...subjectTableData,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(combinedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Full Export");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blobData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blobData);
    const link = document.createElement("a");
    link.href = url;
    link.download = `full_export_${selectedDate}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Compute sums and averages for each column in the subject table
  // ─────────────────────────────────────────────────────────────────────────────
  const rowCount = localHourPlan.length;
  // For subject table, numeric columns (excluding time and non-numeric message columns)
  const sumP1 = localHourPlan.reduce(
    (acc, row) => acc + (Number(row.P1) || 0),
    0
  );
  const avgP1 = rowCount ? sumP1 / rowCount : 0;
  let sumP1Gen = 0,
    avgP1Gen = 0;
  if (showGenColumns) {
    sumP1Gen = localHourPlan.reduce(
      (acc, row) => acc + (Number(row.P1_Gen) || 0),
      0
    );
    avgP1Gen = rowCount ? sumP1Gen / rowCount : 0;
  }
  const sumCoefficient = localHourPlan.reduce(
    (acc, row) => acc + (Number(row.coefficient) || 0),
    0
  );
  const avgCoefficient = rowCount ? sumCoefficient / rowCount : 0;
  let sumCoefficientGen = 0,
    avgCoefficientGen = 0;
  if (showGenColumns) {
    sumCoefficientGen = localHourPlan.reduce(
      (acc, row) => acc + (Number(row.coefficient_Gen) || 0),
      0
    );
    avgCoefficientGen = rowCount ? sumCoefficientGen / rowCount : 0;
  }
  const sumVolume = localHourPlan.reduce(
    (acc, row) => acc + (Number(row.volume) || 0),
    0
  );
  const avgVolume = rowCount ? sumVolume / rowCount : 0;
  let sumVolumeGen = 0,
    avgVolumeGen = 0;
  if (showGenColumns) {
    sumVolumeGen = localHourPlan.reduce(
      (acc, row) => acc + (Number(row.volume_Gen) || 0),
      0
    );
    avgVolumeGen = rowCount ? sumVolumeGen / rowCount : 0;
  }
  const sumP2 = localHourPlan.reduce((acc, row, idx) => {
    const p2 =
      row.P2 !== 0 ? Number(row.P2) : Number(calculateP2(idx, row.P1)) || 0;
    return acc + p2;
  }, 0);
  const avgP2 = rowCount ? sumP2 / rowCount : 0;
  let sumP2Gen = 0,
    avgP2Gen = 0;
  if (showGenColumns) {
    sumP2Gen = localHourPlan.reduce((acc, row, idx) => {
      const p2Gen =
        row.P2_Gen !== 0
          ? Number(row.P2_Gen)
          : Number(calculateP2Gen(idx, row.P1_Gen)) || 0;
      return acc + p2Gen;
    }, 0);
    avgP2Gen = rowCount ? sumP2Gen / rowCount : 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  Compute sums and averages for each column in the object table
  // ─────────────────────────────────────────────────────────────────────────────
  const objectHours = selectedData.selectedObject
    ? objectHoursMap[selectedData.selectedObject] || []
    : [];
  const objRowCount = objectHours.length;
  const objSumP1 = objectHours.reduce(
    (acc, row) => acc + (Number(row.P1) || 0),
    0
  );
  let objSumP1Gen = 0;
  if (
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
  ) {
    objSumP1Gen = objectHours.reduce(
      (acc, row) => acc + (Number(row.P1_Gen) || 0),
      0
    );
  }
  const objSumVolume = objectHours.reduce(
    (acc, row) => acc + (Number(row.volume) || 0),
    0
  );
  const objSumP2 = objectHours.reduce(
    (acc, row) => acc + (Number(row.P2) || 0),
    0
  );
  let objSumP2Gen = 0;
  if (
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
  ) {
    objSumP2Gen = objectHours.reduce(
      (acc, row) => acc + (Number(row.P2_Gen) || 0),
      0
    );
  }
  const objSumP3 = objectHours.reduce(
    (acc, row) => acc + (Number(row.P3) || 0),
    0
  );
  let objSumP3Gen = 0;
  if (
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
  ) {
    objSumP3Gen = objectHours.reduce(
      (acc, row) => acc + (Number(row.P3_Gen) || 0),
      0
    );
  }
  const objSumF1 = objectHours.reduce(
    (acc, row) => acc + (Number(row.F1) || 0),
    0
  );
  let objSumF1Gen = 0;
  if (
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
  ) {
    objSumF1Gen = objectHours.reduce(
      (acc, row) => acc + (Number(row.F1_Gen) || 0),
      0
    );
  }
  const objAvgP1 = objRowCount ? objSumP1 / objRowCount : 0;
  const objAvgP1Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК" &&
    objRowCount
      ? objSumP1Gen / objRowCount
      : 0;
  const objAvgVolume = objRowCount ? objSumVolume / objRowCount : 0;
  const objAvgP2 = objRowCount ? objSumP2 / objRowCount : 0;
  const objAvgP2Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК" &&
    objRowCount
      ? objSumP2Gen / objRowCount
      : 0;
  const objAvgP3 = objRowCount ? objSumP3 / objRowCount : 0;
  const objAvgP3Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК" &&
    objRowCount
      ? objSumP3Gen / objRowCount
      : 0;
  const objAvgF1 = objRowCount ? objSumF1 / objRowCount : 0;
  const objAvgF1Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК" &&
    objRowCount
      ? objSumF1Gen / objRowCount
      : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Info / Warning message */}
      {warningMessage && (
        <div className="mb-4 p-2 bg-yellow-200 text-yellow-800 rounded">
          {warningMessage}
        </div>
      )}

      {/* Subject & Object Status Tables */}
      <div className="mb-4">
        {/* Subject Status */}
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
                        selectedObject: null,
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
                          subjectStatusMap[subject.id],
                          (subject.subject_type !== "CONSUMER" &&
                            subject.subject_type !== "РЭК" &&
                            subject.subject_type !== "ВИЭ"),
                          subject.subject_type === "ВИЭ"
                        )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}

        {/* Object Status */}
        {selectedData.selectedSubject && (
          <table className="w-full text-sm text-center text-gray-500 mb-3">
            <thead className="text-xs text-gray-700 uppercase bg-gray-300">
              <tr>
                <th>Объект</th>
                {objectsList
                  .filter((obj) => obj.subject === selectedData.selectedSubject)
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
                  .filter((obj) => obj.subject === selectedData.selectedSubject)
                  .map((object) => (
                    <td key={object.id} className="border">
                      {loadingObjectStatuses
                        ? "Загрузка..."
                        : objectStatusError
                        ? objectStatusError
                        : generateStatusDisplayComponents(
                            objectStatusMap[object.id],
                            (object.object_type !== "CONSUMER" &&
                              object.object_type !== "РЭК" &&
                              object.object_type !== "ВИЭ"),
                            object.object_type === "ВИЭ"
                          )}
                    </td>
                  ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-col md:flex-row">
        {/* ────────────────────────────────────────────────────────────────────
            SUBJECT TABLE (Left)
          ──────────────────────────────────────────────────────────────────── */}
        <div className="w-full md:w-2/3 mr-0 md:mr-2 mb-4 md:mb-0">
          {/* Hidden file inputs for normal import & GP1 import */}
          <input
            type="file"
            accept=".xlsx"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <input
            type="file"
            accept=".xlsx"
            ref={fileInputRefGP1}
            style={{ display: "none" }}
            onChange={handleFileChangeGP1}
          />

          {selectedData.selectedSubject && (
            <table className="w-full text-sm text-center text-gray-500 mb-3">
              <thead className="text-xs text-gray-700 uppercase bg-gray-300">
                <tr>
                  <th className="w-[50px]">Время</th>
                  <th className="w-[80px]">П1</th>
                  {showGenColumns && <th className="w-[80px]">ГП1</th>}
                  <th className="w-[100px]">Коэффициент</th>
                  {showGenColumns && (
                    <th className="w-[120px]">Коэф. Генерации</th>
                  )}
                  <th className="w-[80px]">Объем</th>
                  {showGenColumns && <th className="w-[110px]">Объем Ген.</th>}
                  <th className="w-[80px]">П2</th>
                  {showGenColumns && <th className="w-[80px]">ГП2</th>}
                  <th className="w-[130px]">Сообщ. П2</th>
                  {showGenColumns && (
                    <th className="w-[140px]">Сообщ. П2 Ген.</th>
                  )}
                  {showMessageCol && <th className="w-[150px]">Сообщение</th>}
                </tr>
              </thead>
              <tbody>
                {timeIntervals.map((time, idx) => {
                  const rowData = localHourPlan[idx] || {};
                  const P1 = rowData.P1 || 0;
                  const p2Val =
                    rowData.P2 !== 0 ? rowData.P2 : calculateP2(idx, P1);
                  return (
                    <tr key={time}>
                      <td className="border">{time}</td>
                      <td className="border">{P1}</td>
                      {showGenColumns && (
                        <td className="border">{rowData.P1_Gen || 0}</td>
                      )}
                      <td className="border">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={rowData.coefficient ?? ""}
                          onChange={(e) =>
                            handleCoefficientChange(idx, e.target.value)
                          }
                          className="w-full text-center rounded"
                        />
                      </td>
                      {showGenColumns && (
                        <td className="border">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={rowData.coefficient_Gen ?? ""}
                            onChange={(e) =>
                              handleCoefficientGenChange(idx, e.target.value)
                            }
                            className="w-full text-center rounded"
                          />
                        </td>
                      )}
                      <td className="border">
                        <input
                          type="number"
                          value={rowData.volume ?? ""}
                          onChange={(e) =>
                            handleVolumeChange(idx, e.target.value)
                          }
                          className="w-full text-center rounded"
                        />
                      </td>
                      {showGenColumns && (
                        <td className="border">
                          <input
                            type="number"
                            value={rowData.volume_Gen ?? ""}
                            onChange={(e) =>
                              handleVolumeGenChange(idx, e.target.value)
                            }
                            className="w-full text-center rounded"
                          />
                        </td>
                      )}
                      <td className="border">{p2Val}</td>
                      {showGenColumns && (
                        <td className="border">
                          {rowData.P2_Gen
                            ? rowData.P2_Gen
                            : calculateP2Gen(idx, rowData.P1_Gen || 0)}
                        </td>
                      )}
                      <td className="border">{rowData.P2_message || ""}</td>
                      {showGenColumns && (
                        <td className="border">
                          {rowData.P2_Gen_message || ""}
                        </td>
                      )}
                      {showMessageCol && (
                        <td className="border">
                          <input
                            type="text"
                            value={rowData.message || ""}
                            onChange={(e) =>
                              handleMessagesChange(idx, e.target.value)
                            }
                            className="w-full text-center rounded"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
                {/* Subject Table Footer: Sums */}
                <tr>
                  <td className="border font-bold">Сумма</td>
                  <td className="border">{sumP1}</td>
                  {showGenColumns && <td className="border">{sumP1Gen}</td>}
                  <td className="border">{sumCoefficient.toFixed(2)}</td>
                  {showGenColumns && (
                    <td className="border">{sumCoefficientGen.toFixed(2)}</td>
                  )}
                  <td className="border">{sumVolume}</td>
                  {showGenColumns && <td className="border">{sumVolumeGen}</td>}
                  <td className="border">{sumP2.toFixed(2)}</td>
                  {showGenColumns && (
                    <td className="border">{sumP2Gen.toFixed(2)}</td>
                  )}
                  {/** For message columns, leave empty */}
                  {showGenColumns && <td className="border"></td>}
                  {showMessageCol && <td className="border"></td>}
                </tr>
                {/* Subject Table Footer: Averages */}
                <tr>
                  <td className="border font-bold">Среднее</td>
                  <td className="border">{avgP1.toFixed(2)}</td>
                  {showGenColumns && (
                    <td className="border">{avgP1Gen.toFixed(2)}</td>
                  )}
                  <td className="border">{avgCoefficient.toFixed(2)}</td>
                  {showGenColumns && (
                    <td className="border">{avgCoefficientGen.toFixed(2)}</td>
                  )}
                  <td className="border">{avgVolume.toFixed(2)}</td>
                  {showGenColumns && (
                    <td className="border">{avgVolumeGen.toFixed(2)}</td>
                  )}
                  <td className="border">{avgP2.toFixed(2)}</td>
                  {showGenColumns && (
                    <td className="border">{avgP2Gen.toFixed(2)}</td>
                  )}
                  {showGenColumns && <td className="border"></td>}
                  {showMessageCol && <td className="border"></td>}
                </tr>
              </tbody>
            </table>
          )}
          {/* Action Buttons for subject table */}
          <div className="flex flex-wrap justify-end space-x-2 mt-4">
            <button
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition"
              onClick={handleSave}
            >
              Сохранить
            </button>
            <button
              className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition"
              onClick={handleApprove}
            >
              Утвердить
            </button>
            <button
              className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition"
              onClick={handleExport}
            >
              Экспорт
            </button>
            <button
              className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition"
              onClick={handleImportFromFile}
            >
              Импорт
            </button>
            {showGenColumns && (
              <>
                <button
                  className="bg-lime-500 text-white px-4 py-2 rounded hover:bg-lime-600 transition"
                  onClick={handleExportGP1}
                >
                  Экспорт ГП1
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-fuchsia-600 transition"
                  onClick={handleImportFromFileGP1}
                >
                  Импорт ГП1
                </button>
              </>
            )}
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              onClick={handleFullExport}
            >
              Экспорт полного отчета
            </button>
          </div>
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

        {/* ────────────────────────────────────────────────────────────────────
            OBJECT TABLE (Right)
          ──────────────────────────────────────────────────────────────────── */}
        <div className="w-full md:w-1/3 ml-0 md:ml-2">
          {selectedData.selectedObject && (
            <table className="w-full text-sm text-center text-gray-500 mb-3">
              {/* Add a first column for row labels */}
              <thead className="text-xs text-gray-700 uppercase bg-gray-300">
                <tr>
                  <th></th>
                  <th>П1</th>
                  {selectedObject?.object_type !== "CONSUMER" &&
                    selectedObject?.object_type !== "РЭК" && <th>ГП1</th>}
                  <th>Объем</th>
                  <th>П2</th>
                  {selectedObject?.object_type !== "CONSUMER" &&
                    selectedObject?.object_type !== "РЭК" && <th>ГП2</th>}
                  <th>П3</th>
                  {selectedObject?.object_type !== "CONSUMER" &&
                    selectedObject?.object_type !== "РЭК" && <th>ГП3</th>}
                  <th>Ф</th>
                  {selectedObject?.object_type !== "CONSUMER" &&
                    selectedObject?.object_type !== "РЭК" && <th>ГФ</th>}
                  <th>Сообщение П2</th>
                  {selectedObject?.object_type !== "CONSUMER" &&
                    selectedObject?.object_type !== "РЭК" && (
                      <th>Сообщ. П2 Ген.</th>
                    )}
                </tr>
              </thead>
              <tbody>
                {timeIntervals.map((time, idx) => {
                  const hourData =
                    objectHoursMap[selectedData.selectedObject]?.find(
                      (h) => h.hour === idx + 1
                    ) || {};
                  return (
                    <tr key={time}>
                      <td className="border">{time}</td>
                      <td className="border">{hourData.P1 || 0}</td>
                      {selectedObject?.object_type !== "CONSUMER" &&
                        selectedObject?.object_type !== "РЭК" && (
                          <td className="border">{hourData.P1_Gen || 0}</td>
                        )}
                      <td className="border">{hourData.volume || 0}</td>
                      <td className="border">{hourData.P2 || 0}</td>
                      {selectedObject?.object_type !== "CONSUMER" &&
                        selectedObject?.object_type !== "РЭК" && (
                          <td className="border">{hourData.P2_Gen || 0}</td>
                        )}
                      <td className="border">{hourData.P3 || 0}</td>
                      {selectedObject?.object_type !== "CONSUMER" &&
                        selectedObject?.object_type !== "РЭК" && (
                          <td className="border">{hourData.P3_Gen || 0}</td>
                        )}
                      <td className="border">{hourData.F1 || 0}</td>
                      {selectedObject?.object_type !== "CONSUMER" &&
                        selectedObject?.object_type !== "РЭК" && (
                          <td className="border">{hourData.F1_Gen || 0}</td>
                        )}
                      <td className="border">{hourData.P2_message || ""}</td>
                      {selectedObject?.object_type !== "CONSUMER" &&
                        selectedObject?.object_type !== "РЭК" && (
                          <td className="border">
                            {hourData.P2_Gen_message || ""}
                          </td>
                        )}
                    </tr>
                  );
                })}
                {/* Object Table Footer for non-CONSUMER objects */}
                {selectedObject &&
                selectedObject.object_type !== "CONSUMER" &&
                selectedObject.object_type !== "РЭК" ? (
                  <>
                    <tr>
                      <td className="border font-bold">Сумма</td>
                      <td className="border">{objSumP1}</td>
                      <td className="border">{objSumP1Gen}</td>
                      <td className="border">{objSumVolume}</td>
                      <td className="border">{objSumP2}</td>
                      <td className="border">{objSumP2Gen.toFixed(2)}</td>
                      <td className="border">{objSumP3}</td>
                      <td className="border">{objSumP3Gen.toFixed(2)}</td>
                      <td className="border">{objSumF1}</td>
                      <td className="border">{objSumF1Gen.toFixed(2)}</td>
                      <td className="border"></td>
                    </tr>
                    <tr>
                      <td className="border font-bold">Среднее</td>
                      <td className="border">{objAvgP1.toFixed(2)}</td>
                      <td className="border">{objAvgP1Gen.toFixed(2)}</td>
                      <td className="border">{objAvgVolume.toFixed(2)}</td>
                      <td className="border">{objAvgP2.toFixed(2)}</td>
                      <td className="border">{objAvgP2Gen.toFixed(2)}</td>
                      <td className="border">{objAvgP3.toFixed(2)}</td>
                      <td className="border">{objAvgP3Gen.toFixed(2)}</td>
                      <td className="border">{objAvgF1.toFixed(2)}</td>
                      <td className="border">{objAvgF1Gen.toFixed(2)}</td>
                      <td className="border"></td>
                    </tr>
                  </>
                ) : selectedObject ? (
                  // For CONSUMER objects – add an extra header cell for row labels
                  <>
                    <tr>
                      <td className="border font-bold">Сумма</td>
                      <td className="border">{objSumP1}</td>
                      <td className="border">{objSumVolume}</td>
                      <td className="border">{objSumP2}</td>
                      <td className="border">{objSumP3}</td>
                      <td className="border">{objSumF1}</td>
                      <td className="border"></td>
                    </tr>
                    <tr>
                      <td className="border font-bold">Среднее</td>
                      <td className="border">
                        {objRowCount ? (objSumP1 / objRowCount).toFixed(2) : 0}
                      </td>
                      <td className="border">
                        {objRowCount
                          ? (objSumVolume / objRowCount).toFixed(2)
                          : 0}
                      </td>
                      <td className="border">
                        {objRowCount ? (objSumP2 / objRowCount).toFixed(2) : 0}
                      </td>
                      <td className="border">
                        {objRowCount ? (objSumP3 / objRowCount).toFixed(2) : 0}
                      </td>
                      <td className="border">
                        {objRowCount ? (objSumF1 / objRowCount).toFixed(2) : 0}
                      </td>
                      <td className="border"></td>
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombinedTable;

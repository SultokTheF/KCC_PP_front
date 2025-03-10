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
  };

  const selectedSubject = subjectsList.find(
    (sub) => sub.id === selectedData.selectedSubject
  );
  const selectedObject = objectsList.find(
    (obj) => obj.id === selectedData.selectedObject
  );

  // Calculate P2 from P1 * coefficient + volume
  const calculateP2 = (index, P1) => {
    const c = localHourPlan[index]?.coefficient || 0;
    const v = localHourPlan[index]?.volume || 0;
    return (P1 * c + v).toFixed(2);
  };

  // Calculate P2_Gen from P1_Gen * coefficient_Gen + volume_Gen
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
      if (!isNaN(hour) && !isNaN(coefficient) && !isNaN(volume) && i >= 0 && i < 24) {
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
    const blobData = new Blob([excelBuffer], { type: "application/octet-stream" });
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
    // Build subject table
    const subjectTableHeaders = [
      "Time",
      "P1",
      ...(selectedSubject?.subject_type !== "CONSUMER" ? ["P1_Gen"] : []),
      "P2",
      ...(selectedSubject?.subject_type !== "CONSUMER" ? ["P2_Gen"] : []),
      "P3",
      ...(selectedSubject?.subject_type !== "CONSUMER" ? ["P3_Gen"] : []),
      "F1",
      ...(selectedSubject?.subject_type !== "CONSUMER" ? ["F1_Gen"] : []),
      "F2",
      ...(selectedSubject?.subject_type !== "CONSUMER" ? ["F2_Gen"] : []),
      "Coefficient",
      "Coefficient_Gen",
      "Volume",
      "Volume_Gen",
      "P2_Message",
      ...(selectedSubject?.subject_type !== "CONSUMER" ? ["P2_Gen_message"] : []),
      ...(showMessageCol ? ["Message"] : []),
    ];

    const subjectTableData = [
      subjectTableHeaders,
      ...timeIntervals.map((time, idx) => {
        const row = localHourPlan[idx] || {};
        return [
          time,
          row.P1 || 0,
          ...(selectedSubject?.subject_type !== "CONSUMER"
            ? [row.P1_Gen || 0]
            : []),
          row.P2 || calculateP2(idx, row.P1 || 0),
          ...(selectedSubject?.subject_type !== "CONSUMER"
            ? [row.P2_Gen || calculateP2Gen(idx, row.P1_Gen || 0)]
            : []),
          row.P3 || 0,
          ...(selectedSubject?.subject_type !== "CONSUMER" ? [row.P3_Gen || 0] : []),
          row.F1 || 0,
          ...(selectedSubject?.subject_type !== "CONSUMER" ? [row.F1_Gen || 0] : []),
          row.F2 || 0,
          ...(selectedSubject?.subject_type !== "CONSUMER" ? [row.F2_Gen || 0] : []),
          row.coefficient ?? "",
          row.coefficient_Gen ?? "",
          row.volume ?? "",
          row.volume_Gen ?? "",
          row.P2_message || "",
          ...(selectedSubject?.subject_type !== "CONSUMER"
            ? [row.P2_Gen_message || ""]
            : []),
          ...(showMessageCol ? [row.message || ""] : []),
        ];
      }),
    ];

    // Build object tables
    const objectsData = objectsList
      .filter((obj) => obj.subject === selectedData.selectedSubject)
      .map((object) => {
        const objectHours = objectHoursMap[object.id] || [];
        const objectTableHeaders = [
          "Time",
          "P1",
          ...(object?.object_type !== "CONSUMER" ? ["P1_Gen"] : []),
          "P2",
          ...(object?.object_type !== "CONSUMER" ? ["P2_Gen"] : []),
          "P3",
          ...(object?.object_type !== "CONSUMER" ? ["P3_Gen"] : []),
          "F1",
          ...(object?.object_type !== "CONSUMER" ? ["F1_Gen"] : []),
          "F2",
          ...(object?.object_type !== "CONSUMER" ? ["F2_Gen"] : []),
          "P2_Message",
          ...(object?.object_type !== "CONSUMER" ? ["P2_Gen_message"] : []),
        ];

        const objectTableData = [
          objectTableHeaders,
          ...timeIntervals.map((time, i) => {
            const hourData = objectHours.find((h) => h.hour === i + 1) || {};
            return [
              time,
              hourData.P1 || 0,
              ...(object?.object_type !== "CONSUMER"
                ? [hourData.P1_Gen || 0]
                : []),
              hourData.P2 || 0,
              ...(object?.object_type !== "CONSUMER"
                ? [hourData.P2_Gen || 0]
                : []),
              hourData.P3 || 0,
              ...(object?.object_type !== "CONSUMER"
                ? [hourData.P3_Gen || 0]
                : []),
              hourData.F1 || 0,
              ...(object?.object_type !== "CONSUMER"
                ? [hourData.F1_Gen || 0]
                : []),
              hourData.F2 || 0,
              ...(object?.object_type !== "CONSUMER"
                ? [hourData.F2_Gen || 0]
                : []),
              hourData.P2_message || "",
              ...(object?.object_type !== "CONSUMER"
                ? [hourData.P2_Gen_message || ""]
                : []),
            ];
          }),
        ];
        return {
          objectName: object.object_name,
          data: objectTableData,
        };
      });

    // Combine into single sheet
    const combinedData = [
      ["Subject:", selectedSubject?.subject_name || "Unknown"],
      [],
      ["Subject Table"],
      ...subjectTableData,
      [],
    ];
    objectsData.forEach((objData) => {
      combinedData.push(["Object:", objData.objectName]);
      combinedData.push([]);
      combinedData.push(...objData.data);
      combinedData.push([]);
    });

    // Build workbook & export
    const worksheet = XLSX.utils.aoa_to_sheet(combinedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Full Export");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blobData = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blobData);
    const link = document.createElement("a");
    link.href = url;
    link.download = `full_export_${selectedDate}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
                      : generateStatusDisplayComponents(subjectStatusMap[subject.id])}
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
                        : generateStatusDisplayComponents(objectStatusMap[object.id])}
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

          {/* Only show table if a subject is selected */}
          {selectedData.selectedSubject && (
            <table className="w-full text-sm text-center text-gray-500 mb-3">
              <thead className="text-xs text-gray-700 uppercase bg-gray-300">
                <tr>
                  <th className="w-[50px]">Время</th>
                  <th className="w-[80px]">П1</th>
                  {selectedSubject?.subject_type !== "CONSUMER" && (
                    <th className="w-[80px]">ГП1</th>
                  )}
                  <th className="w-[100px]">Коэффициент</th>
                  {selectedSubject?.subject_type !== "CONSUMER" && (
                    <th className="w-[120px]">Коэф. Генерации</th>
                  )}
                  <th className="w-[80px]">Объем</th>
                  {selectedSubject?.subject_type !== "CONSUMER" && (
                    <th className="w-[110px]">Объем Ген.</th>
                  )}
                  <th className="w-[80px]">П2</th>
                  {selectedSubject?.subject_type !== "CONSUMER" && (
                    <th className="w-[80px]">ГП2</th>
                  )}
                  <th className="w-[130px]">Сообщ. П2</th>
                  {selectedSubject?.subject_type !== "CONSUMER" && (
                    <th className="w-[140px]">Сообщ. П2 Ген.</th>
                  )}
                  {showMessageCol && <th className="w-[150px]">Сообщение</th>}
                </tr>
              </thead>
              <tbody>
                {timeIntervals.map((time, idx) => {
                  const rowData = localHourPlan[idx] || {};
                  const P1 = rowData.P1 || 0;
                  const P1_Gen = rowData.P1_Gen || 0;
                  const P2_msg = rowData.P2_message || "";
                  const P2_gen_msg = rowData.P2_Gen_message || "";

                  // If rowData.P2 is 0, calculate it
                  const P2Val =
                    rowData.P2 !== 0 ? rowData.P2 : calculateP2(idx, P1);

                  return (
                    <tr key={time}>
                      <td className="border">{time}</td>
                      <td className="border">{P1}</td>
                      {selectedSubject?.subject_type !== "CONSUMER" && (
                        <td className="border">{P1_Gen}</td>
                      )}
                      {/* Coefficient */}
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
                      {/* Coefficient_Gen if not consumer */}
                      {selectedSubject?.subject_type !== "CONSUMER" && (
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
                      {/* Volume */}
                      <td className="border">
                        <input
                          type="number"
                          value={rowData.volume ?? ""}
                          onChange={(e) => handleVolumeChange(idx, e.target.value)}
                          className="w-full text-center rounded"
                        />
                      </td>
                      {/* Volume_Gen if not consumer */}
                      {selectedSubject?.subject_type !== "CONSUMER" && (
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
                      {/* P2 */}
                      <td className="border">{P2Val}</td>
                      {/* P2_Gen */}
                      {selectedSubject?.subject_type !== "CONSUMER" && (
                        <td className="border">
                          {rowData.P2_Gen
                            ? rowData.P2_Gen
                            : calculateP2Gen(idx, P1_Gen)}
                        </td>
                      )}
                      {/* P2_message */}
                      <td
                        className={`border ${
                          P2_msg
                            ? P2_msg === "Успешно!"
                              ? "bg-green-100"
                              : "bg-red-100"
                            : ""
                        }`}
                      >
                        {P2_msg}
                      </td>
                      {/* P2_Gen_message */}
                      {selectedSubject?.subject_type !== "CONSUMER" && (
                        <td
                          className={`border ${
                            P2_gen_msg
                              ? P2_gen_msg === "Успешно!"
                                ? "bg-green-100"
                                : "bg-red-100"
                              : ""
                          }`}
                        >
                          {P2_gen_msg}
                        </td>
                      )}
                      {/* Disapproval Message */}
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
              </tbody>
            </table>
          )}

          {/* Action Buttons (all in one row) */}
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
            {selectedSubject?.subject_type !== "CONSUMER" && (
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

          {/* If disapprove is active, show "Отправить" + "Отмена" */}
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
              <thead className="text-xs text-gray-700 uppercase bg-gray-300">
                <tr>
                  <th>П1</th>
                  {selectedObject?.object_type !== "CONSUMER" && <th>ГП1</th>}
                  <th>Объем</th>
                  <th>П2</th>
                  {selectedObject?.object_type !== "CONSUMER" && <th>ГП2</th>}
                  <th>П3</th>
                  {selectedObject?.object_type !== "CONSUMER" && <th>ГП3</th>}
                  <th>Ф</th>
                  {selectedObject?.object_type !== "CONSUMER" && <th>ГФ</th>}
                  <th>Сообщение П2</th>
                  {selectedObject?.object_type !== "CONSUMER" && (
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
                      <td className="border">{hourData.P1 || 0}</td>
                      {selectedObject?.object_type !== "CONSUMER" && (
                        <td className="border">{hourData.P1_Gen || 0}</td>
                      )}
                      <td className="border">{hourData.volume || 0}</td>
                      <td className="border">{hourData.P2 || 0}</td>
                      {selectedObject?.object_type !== "CONSUMER" && (
                        <td className="border">{hourData.P2_Gen || 0}</td>
                      )}
                      <td className="border">{hourData.P3 || 0}</td>
                      {selectedObject?.object_type !== "CONSUMER" && (
                        <td className="border">{hourData.P3_Gen || 0}</td>
                      )}
                      <td className="border">{hourData.F1 || 0}</td>
                      {selectedObject?.object_type !== "CONSUMER" && (
                        <td className="border">{hourData.F1_Gen || 0}</td>
                      )}
                      <td
                        className={`border ${
                          hourData.P2_message
                            ? hourData.P2_message === "Успешно!"
                              ? "bg-green-100"
                              : "bg-red-100"
                            : ""
                        }`}
                      >
                        {hourData.P2_message || ""}
                      </td>
                      {selectedObject?.object_type !== "CONSUMER" && (
                        <td
                          className={`border ${
                            hourData.P2_Gen_message
                              ? hourData.P2_Gen_message === "Успешно!"
                                ? "bg-green-100"
                                : "bg-red-100"
                              : ""
                          }`}
                        >
                          {hourData.P2_Gen_message || ""}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombinedTable;

/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import useDataFetching from "../../../../../hooks/useDataFetching";
import CreatePlanModal from "../CreatePlanModal/CreatePlanModal";
import {
  faEdit,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Helper to prevent NaN/Infinity if rowCount = 0
const safeAvg = (total, count) => {
  if (count <= 0) return "0.00";
  return (total / count).toFixed(2);
};

const timeIntervals = [
  "00 - 01", "01 - 02", "02 - 03", "03 - 04", "04 - 05", "05 - 06",
  "06 - 07", "07 - 08", "08 - 09", "09 - 10", "10 - 11", "11 - 12",
  "12 - 13", "13 - 14", "14 - 15", "15 - 16", "16 - 17", "17 - 18",
  "18 - 19", "19 - 20", "20 - 21", "21 - 22", "22 - 23", "23 - 00",
];

const ObjectTable = ({
  selectedData,
  setSelectedData,
  objectsList,
  selectedDate,
  dependedObjects,
}) => {
  // Fixed column width (80px)
  const fixedStyle = { width: "80px" };

  // Styles for extra depended-sum columns (customize colors as needed)
  const sumDepP1Style = { backgroundColor: "#e0f7fa" }; // light blue for P1 sum
  const sumDepF1Style = { backgroundColor: "#ffebee" }; // light red for F1 sum

  const [isModalOpen, setIsModalOpen] = useState(false);
  // Toggle to show/hide depended objects' extra columns
  const [showDepended, setShowDepended] = useState(false);

  // Extract depended details from the API response (assumes a single monthly entry)
  const dependedData =
    dependedObjects && dependedObjects.length > 0
      ? dependedObjects[0]
      : null;
  const dependedDetails = dependedData ? dependedData.depended_objects_details : [];

  // If we do want to show the depended columns, we must ensure we have
  // at least one depended object to display.
  const haveDepended = showDepended && dependedDetails.length > 0;

  const selectedObject = objectsList.find(
    (object) => object.id === selectedData.selectedObject
  );

  const { daysList, hoursList } = useDataFetching(
    selectedDate,
    selectedData.selectedObject,
    "object"
  );

  const dayPlan = daysList?.find(
    (day) =>
      day.object === selectedObject?.id &&
      day.date.split("T")[0] === selectedDate.split("T")[0]
  );

  const unsortedHourPlan =
    hoursList?.filter((hour) => hour.day === dayPlan?.id) || [];
  const hourPlan = [...unsortedHourPlan].sort((a, b) => a.hour - b.hour);

  const [planData, setPlanData] = useState({
    planMode: "P1",
    isGen: false,
  });

  const [statusMap, setStatusMap] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusError, setStatusError] = useState(null);

  const getPlanStatus = async (date, object) => {
    try {
      const response = await axiosInstance.get(endpoints.GET_STATUS, {
        params: {
          date,
          object: object.id,
        },
      });
      return response.data || {};
    } catch (error) {
      console.error(`Error fetching status for object ${object.id}:`, error);
      return {};
    }
  };

  useEffect(() => {
    const fetchAllStatuses = async () => {
      setLoadingStatuses(true);
      setStatusError(null);
      const newStatusMap = {};

      try {
        const statusPromises = objectsList.map((object) =>
          getPlanStatus(selectedDate, object).then((statuses) => ({
            id: object.id,
            statuses,
          }))
        );

        const statuses = await Promise.all(statusPromises);
        statuses.forEach(({ id, statuses }) => {
          newStatusMap[id] = statuses;
        });

        setStatusMap(newStatusMap);
      } catch (error) {
        setStatusError("Ошибка при загрузке статусов.");
        console.error("Error fetching statuses:", error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    if (selectedDate && objectsList.length > 0) {
      fetchAllStatuses();
    }
  }, [selectedDate, objectsList]);

  // Same status display logic
  const generateStatusDisplayComponents = (statuses, isCombined, is_res) => {
    if (!statuses || Object.keys(statuses).length === 0) return "Нет данных";
    if (isCombined) {
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
              <span key={plan} className={`${colorClass} mx-1`} style={fixedStyle}>
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
              <span key={plan} className={`${colorClass} mx-1`} style={fixedStyle}>
                {plan === "F1" ? "Ф" : plan === "P1" ? "П1" : plan === "P2" ? "П2" : "П3"}
              </span>
            );
          })}
        </div>
      );
    } else {
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
              <span key={key} className={`${colorClass} mx-1`} style={fixedStyle}>
                {planName}
              </span>
            );
          })}
        </div>
      );
    }
  };

  // Filter objects for the chosen subject
  const objects = objectsList.filter(
    (object) => object.subject === selectedData.selectedSubject
  );

  useEffect(() => {
    if (!selectedData.selectedObject && objects.length > 0) {
      setSelectedData((prevData) => ({
        ...prevData,
        selectedObject: objects[0]?.id || 0,
      }));
    }
  }, [selectedData.selectedSubject, objects, setSelectedData, selectedData.selectedObject]);

  // *********************************
  // Summaries for depended objects
  // *********************************
  // We'll do these only if we have Depended objects:
  //  -> row sums for each interval’s P1 & F1
  //  -> total across all intervals (sum of sums)
  //  -> average across intervals
  const dependedP1RowSums = timeIntervals.map((_, i) =>
    dependedDetails.reduce((sum, detail) => {
      const match = detail.hours.find(
        (h) => Number(h.hour) === i + 1 && h.date === selectedDate
      );
      return sum + (match ? Number(match.P1) : 0);
    }, 0)
  );
  const dependedP1Total = dependedP1RowSums.reduce((acc, curr) => acc + curr, 0);

  const dependedF1RowSums = timeIntervals.map((_, i) =>
    dependedDetails.reduce((sum, detail) => {
      const match = detail.hours.find(
        (h) => Number(h.hour) === i + 1 && h.date === selectedDate
      );
      return sum + (match ? Number(match.F1) : 0);
    }, 0)
  );
  const dependedF1Total = dependedF1RowSums.reduce((acc, curr) => acc + curr, 0);

  // rowCount is how many rows the main object has. If rowCount = 0,
  // we'll do 0 for average to avoid NaN / Infinity.
  const rowCount = hourPlan.length;

  // *********************************
  // Summaries for the main object
  // *********************************
  const sumP1 = hourPlan.reduce((acc, row) => acc + (Number(row.P1) || 0), 0);
  const sumP1Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
      ? hourPlan.reduce((acc, row) => acc + (Number(row.P1_Gen) || 0), 0)
      : 0;
  const sumP2 = hourPlan.reduce((acc, row) => acc + (Number(row.P2) || 0), 0);
  const sumP2Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
      ? hourPlan.reduce((acc, row) => acc + (Number(row.P2_Gen) || 0), 0)
      : 0;
  const sumP3 = hourPlan.reduce((acc, row) => acc + (Number(row.P3) || 0), 0);
  const sumP3Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
      ? hourPlan.reduce((acc, row) => acc + (Number(row.P3_Gen) || 0), 0)
      : 0;
  const sumF1 = hourPlan.reduce((acc, row) => acc + (Number(row.F1) || 0), 0);
  const sumF1Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
      ? hourPlan.reduce((acc, row) => acc + (Number(row.F1_Gen) || 0), 0)
      : 0;

  const avgP1 = selectedObject && selectedObject.object_type !== "ВИЭ"
    ? safeAvg(sumP1, rowCount)
    : "0.00";
  const avgP1Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
      ? safeAvg(sumP1Gen, rowCount)
      : "0.00";
  const avgP2 = selectedObject && selectedObject.object_type !== "ВИЭ"
    ? safeAvg(sumP2, rowCount)
    : "0.00";
  const avgP2Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
      ? safeAvg(sumP2Gen, rowCount)
      : "0.00";
  const avgP3 = selectedObject && selectedObject.object_type !== "ВИЭ"
    ? safeAvg(sumP3, rowCount)
    : "0.00";
  const avgP3Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
      ? safeAvg(sumP3Gen, rowCount)
      : "0.00";
  const avgF1 = selectedObject && selectedObject.object_type !== "ВИЭ"
    ? safeAvg(sumF1, rowCount)
    : "0.00";
  const avgF1Gen =
    selectedObject &&
    selectedObject.object_type !== "CONSUMER" &&
    selectedObject.object_type !== "РЭК"
      ? safeAvg(sumF1Gen, rowCount)
      : "0.00";

  // Similarly, compute average for the entire set of depended objects:
  const dependedP1Avg = safeAvg(dependedP1Total, rowCount);
  const dependedF1Avg = safeAvg(dependedF1Total, rowCount);

  return (
    <>
      {/* Status Table */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th style={fixedStyle}>Объект</th>
            {objects.map((object) => (
              <th key={object.id} style={fixedStyle}>
                {object.object_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border" scope="row" style={fixedStyle}>
              Статус
            </td>
            {objects.map((object) => (
              <td
                key={object.id}
                className={`border hover:bg-blue-100 cursor-pointer ${
                  selectedData.selectedObject === object.id
                    ? "bg-blue-500 text-white"
                    : ""
                }`}
                style={fixedStyle}
                onClick={() =>
                  setSelectedData((prevData) => ({
                    ...prevData,
                    selectedObject: object.id,
                  }))
                }
              >
                {loadingStatuses
                  ? "Загрузка..."
                  : statusError
                  ? statusError
                  : generateStatusDisplayComponents(
                      statusMap[object.id],
                      object.object_type !== "CONSUMER" &&
                        object.object_type !== "РЭК" &&
                        object.object_type !== "ВИЭ",
                      object.object_type === "ВИЭ"
                    )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Plan Table */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th style={fixedStyle}>
              {/* Button to toggle showing/hiding depended columns */}
              {dependedObjects && dependedObjects.length > 0 && (
                <button
                  onClick={() => setShowDepended(!showDepended)}
                  className="ml-2 text-blue-500 hover:underline flex items-center"
                  style={fixedStyle}
                >
                  <FontAwesomeIcon icon={faFolderOpen} />
                  <span className="ml-1" style={fixedStyle}>
                    {showDepended ? "Скрыть" : "Показать"}
                  </span>
                </button>
              )}
            </th>
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <>
                {/* Main Object P1 */}
                <th style={fixedStyle}>
                  П1
                  <button
                    className="text-base mx-1"
                    onClick={() => {
                      setIsModalOpen(true);
                      setPlanData({
                        planMode: "P1",
                        isGen: false,
                      });
                    }}
                    style={fixedStyle}
                  >
                    📝
                  </button>
                </th>

                {/* Depended Objects P1 columns */}
                {haveDepended &&
                  dependedDetails.map((detail) => (
                    <th key={`dep-p1-${detail.object_id}`} style={fixedStyle}>
                      П1 ({detail.object_name})
                    </th>
                  ))}

                {/* ΣП1 column (only if haveDepended) */}
                {haveDepended && (
                  <th style={{ ...fixedStyle, ...sumDepP1Style }}>ΣП1</th>
                )}
              </>
            )}
            {/* Main Object P1_Gen */}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <th style={fixedStyle}>
                  ГП1
                  <button
                    className="text-base mx-1"
                    onClick={() => {
                      setIsModalOpen(true);
                      setPlanData({
                        planMode: "P1_Gen",
                        isGen: true,
                      });
                    }}
                    style={fixedStyle}
                  >
                    📝
                  </button>
                </th>
            )}
            {/* Main Object P2 */}
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <th style={fixedStyle}>П2</th>
            )}
            {/* Main Object P2_Gen */}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <th style={fixedStyle}>ГП2</th>
              )}
            {/* Main Object P3 */}
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <th style={fixedStyle}>
                П3
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: "P3",
                      isGen: false,
                    });
                  }}
                  style={fixedStyle}
                >
                  📝
                </button>
              </th>
            )}
            {/* Main Object P3_Gen */}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <th style={fixedStyle}>
                  ГП3
                  <button
                    className="text-base mx-1"
                    onClick={() => {
                      setIsModalOpen(true);
                      setPlanData({
                        planMode: "P3_Gen",
                        isGen: true,
                      });
                    }}
                    style={fixedStyle}
                  >
                    📝
                  </button>
                </th>
            )}
            {/* Main Object F1 */}
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <>
                <th style={fixedStyle}>
                  Ф1
                  <button
                    className="text-base mx-1"
                    onClick={() => {
                      setIsModalOpen(true);
                      setPlanData({
                        planMode: "F1",
                        isGen: false,
                      });
                    }}
                    style={fixedStyle}
                  >
                    📝
                  </button>
                </th>

                {/* Depended Objects F1 columns */}
                {haveDepended &&
                  dependedDetails.map((detail) => (
                    <th key={`dep-f1-${detail.object_id}`} style={fixedStyle}>
                      Ф1 ({detail.object_name})
                    </th>
                  ))}

                {/* ΣФ1 column (only if haveDepended) */}
                {haveDepended && (
                  <th style={{ ...fixedStyle, ...sumDepF1Style }}>ΣФ1</th>
                )}
              </>
            )}
            {/* Main Object F1_Gen */}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <th style={fixedStyle}>
                  ГФ1
                  <button
                    className="text-base mx-1"
                    onClick={() => {
                      setIsModalOpen(true);
                      setPlanData({
                        planMode: "F1_Gen",
                        isGen: true,
                      });
                    }}
                    style={fixedStyle}
                  >
                    📝
                  </button>
                </th>
            )}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              <td className="border" style={fixedStyle}>{time}</td>
              {selectedObject && selectedObject.object_type !== "ВИЭ" && (
                <>
                  {/* Main P1 */}
                  <td className="border" style={fixedStyle}>
                    {hourPlan[index]?.P1 || 0}
                  </td>
                  {/* Depended P1 columns */}
                  {haveDepended &&
                    dependedDetails.map((detail) => {
                      const matchingHour = detail.hours.find(
                        (h) =>
                          Number(h.hour) === index + 1 &&
                          h.date === selectedDate
                      );
                      const value = matchingHour ? matchingHour.P1 : 0;
                      return (
                        <td
                          key={`dep-p1-${detail.object_id}-${index}`}
                          className="border"
                          style={fixedStyle}
                        >
                          {value}
                        </td>
                      );
                    })}
                  {/* ΣП1 cell */}
                  {haveDepended && (
                    <td
                      key={`dep-p1-sum-${index}`}
                      className="border"
                      style={{ ...fixedStyle, ...sumDepP1Style }}
                    >
                      {dependedDetails.reduce((sum, detail) => {
                        const mHour = detail.hours.find(
                          (h) =>
                            Number(h.hour) === index + 1 &&
                            h.date === selectedDate
                        );
                        return sum + (mHour ? Number(mHour.P1) : 0);
                      }, 0)}
                    </td>
                  )}
                </>
              )}
              {/* Main P1_Gen */}
              {selectedObject &&
                selectedObject.object_type !== "CONSUMER" &&
                selectedObject.object_type !== "РЭК" && (
                  <td className="border" style={fixedStyle}>
                    {hourPlan[index]?.P1_Gen || 0}
                  </td>
              )}
              {/* Main P2 */}
              {selectedObject && selectedObject.object_type !== "ВИЭ" && (
                <td className="border" style={fixedStyle}>
                  {hourPlan[index]?.P2 || 0}
                </td>
              )}
              {/* Main P2_Gen */}
              {selectedObject &&
                selectedObject.object_type !== "CONSUMER" &&
                selectedObject.object_type !== "РЭК" && (
                  <td className="border" style={fixedStyle}>
                    {hourPlan[index]?.P2_Gen || 0}
                  </td>
              )}
              {/* Main P3 */}
              {selectedObject && selectedObject.object_type !== "ВИЭ" && (
                <td className="border" style={fixedStyle}>
                  {hourPlan[index]?.P3 || 0}
                </td>
              )}
              {/* Main P3_Gen */}
              {selectedObject &&
                selectedObject.object_type !== "CONSUMER" &&
                selectedObject.object_type !== "РЭК" && (
                  <td className="border" style={fixedStyle}>
                    {hourPlan[index]?.P3_Gen || 0}
                  </td>
              )}
              {/* Main F1 */}
              {selectedObject && selectedObject.object_type !== "ВИЭ" && (
                <>
                  <td className="border" style={fixedStyle}>
                    {hourPlan[index]?.F1 || 0}
                  </td>
                  {/* Depended F1 columns */}
                  {haveDepended &&
                    dependedDetails.map((detail) => {
                      const matchingHour = detail.hours.find(
                        (h) =>
                          Number(h.hour) === index + 1 &&
                          h.date === selectedDate
                      );
                      const value = matchingHour ? matchingHour.F1 : 0;
                      return (
                        <td
                          key={`dep-f1-${detail.object_id}-${index}`}
                          className="border"
                          style={fixedStyle}
                        >
                          {value}
                        </td>
                      );
                    })}
                  {/* ΣФ1 cell */}
                  {haveDepended && (
                    <td
                      key={`dep-f1-sum-${index}`}
                      className="border"
                      style={{ ...fixedStyle, ...sumDepF1Style }}
                    >
                      {dependedDetails.reduce((sum, detail) => {
                        const mHour = detail.hours.find(
                          (h) =>
                            Number(h.hour) === index + 1 &&
                            h.date === selectedDate
                        );
                        return sum + (mHour ? Number(mHour.F1) : 0);
                      }, 0)}
                    </td>
                  )}
                </>
              )}
              {/* Main F1_Gen */}
              {selectedObject &&
                selectedObject.object_type !== "CONSUMER" &&
                selectedObject.object_type !== "РЭК" && (
                  <td className="border" style={fixedStyle}>
                    {hourPlan[index]?.F1_Gen || 0}
                  </td>
              )}
            </tr>
          ))}
          {/* Summary Row: Сумма */}
          <tr>
            <td className="border font-bold" style={fixedStyle}>
              Сумма
            </td>
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <>
                <td className="border" style={fixedStyle}>
                  {sumP1}
                </td>
                {haveDepended &&
                  dependedDetails.map((detail) => (
                    <td
                      key={`dep-sum-p1-${detail.object_id}`}
                      className="border"
                      style={fixedStyle}
                    >
                      {detail.hours.reduce(
                        (acc, curr) =>
                          curr.date === selectedDate
                            ? acc + (Number(curr.P1) || 0)
                            : acc,
                        0
                      )}
                    </td>
                  ))}
                {haveDepended && (
                  <td
                    className="border"
                    style={{ ...fixedStyle, ...sumDepP1Style }}
                  >
                    {dependedP1Total}
                  </td>
                )}
              </>
            )}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <td className="border" style={fixedStyle}>
                  {sumP1Gen.toFixed(2)}
                </td>
            )}
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <td className="border" style={fixedStyle}>
                {sumP2.toFixed(2)}
              </td>
            )}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <td className="border" style={fixedStyle}>
                  {sumP2Gen.toFixed(2)}
                </td>
            )}
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <td className="border" style={fixedStyle}>
                {sumP3}
              </td>
            )}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <td className="border" style={fixedStyle}>
                  {sumP3Gen}
                </td>
            )}
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <>
                <td className="border" style={fixedStyle}>
                  {sumF1}
                </td>
                {haveDepended &&
                  dependedDetails.map((detail) => (
                    <td
                      key={`dep-sum-f1-${detail.object_id}`}
                      className="border"
                      style={fixedStyle}
                    >
                      {detail.hours.reduce(
                        (acc, curr) =>
                          curr.date === selectedDate
                            ? acc + (Number(curr.F1) || 0)
                            : acc,
                        0
                      )}
                    </td>
                  ))}
                {haveDepended && (
                  <td
                    className="border"
                    style={{ ...fixedStyle, ...sumDepF1Style }}
                  >
                    {dependedF1Total}
                  </td>
                )}
              </>
            )}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <td className="border" style={fixedStyle}>
                  {sumF1Gen}
                </td>
            )}
          </tr>
          {/* Summary Row: Среднее */}
          <tr>
            <td className="border font-bold" style={fixedStyle}>
              Среднее
            </td>
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <>
                <td className="border" style={fixedStyle}>
                  {avgP1}
                </td>
                {haveDepended &&
                  dependedDetails.map((detail) => {
                    // Summation for this detail's P1
                    const detailP1Total = detail.hours.reduce(
                      (acc, curr) =>
                        curr.date === selectedDate
                          ? acc + (Number(curr.P1) || 0)
                          : acc,
                      0
                    );
                    return (
                      <td
                        key={`dep-avg-p1-${detail.object_id}`}
                        className="border"
                        style={fixedStyle}
                      >
                        {safeAvg(detailP1Total, rowCount)}
                      </td>
                    );
                  })}
                {haveDepended && (
                  <td
                    className="border"
                    style={{ ...fixedStyle, ...sumDepP1Style }}
                  >
                    {dependedP1Avg}
                  </td>
                )}
              </>
            )}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <td className="border" style={fixedStyle}>
                  {avgP1Gen}
                </td>
            )}
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <td className="border" style={fixedStyle}>
                {avgP2}
              </td>
            )}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <td className="border" style={fixedStyle}>
                  {avgP2Gen}
                </td>
            )}
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <td className="border" style={fixedStyle}>
                {avgP3}
              </td>
            )}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <td className="border" style={fixedStyle}>
                  {avgP3Gen}
                </td>
            )}
            {selectedObject && selectedObject.object_type !== "ВИЭ" && (
              <>
                <td className="border" style={fixedStyle}>
                  {avgF1}
                </td>
                {haveDepended &&
                  dependedDetails.map((detail) => {
                    // Summation for this detail's F1
                    const detailF1Total = detail.hours.reduce(
                      (acc, curr) =>
                        curr.date === selectedDate
                          ? acc + (Number(curr.F1) || 0)
                          : acc,
                      0
                    );
                    return (
                      <td
                        key={`dep-avg-f1-${detail.object_id}`}
                        className="border"
                        style={fixedStyle}
                      >
                        {safeAvg(detailF1Total, rowCount)}
                      </td>
                    );
                  })}
                {haveDepended && (
                  <td
                    className="border"
                    style={{ ...fixedStyle, ...sumDepF1Style }}
                  >
                    {dependedF1Avg}
                  </td>
                )}
              </>
            )}
            {selectedObject &&
              selectedObject.object_type !== "CONSUMER" &&
              selectedObject.object_type !== "РЭК" && (
                <td className="border" style={fixedStyle}>
                  {avgF1Gen}
                </td>
            )}
          </tr>
        </tbody>
      </table>

      <CreatePlanModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedObject={selectedObject}
        objectList={objectsList}
        plans={hourPlan}
        planMode={planData.planMode}
        isGen={planData.isGen}
      />
    </>
  );
};

export default ObjectTable;

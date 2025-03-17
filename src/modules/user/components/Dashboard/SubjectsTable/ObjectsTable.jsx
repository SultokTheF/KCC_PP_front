// src/components/Dashboard/SubjectsTable/ObjectsTable.jsx
import React, { useState, useEffect } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import useDataFetching from "../../../../../hooks/useDataFetching";
import CreatePlanModal from "../CreatePlanModal/CreatePlanModal";

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
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Filter hours for the chosen object/day, then sort by hour
  const unsortedHourPlan = hoursList?.filter((hour) => hour.day === dayPlan?.id) || [];
  const hourPlan = [...unsortedHourPlan].sort((a, b) => a.hour - b.hour);

  const [planData, setPlanData] = useState({
    planMode: "P1",
    isGen: false,
  });

  // State for statuses
  const [statusMap, setStatusMap] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusError, setStatusError] = useState(null);

  // Asynchronous Function to Fetch Status
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

  // Fetch statuses for all objects
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

  // Helper to generate status display
  const generateStatusDisplayComponents = (statuses) => {
    if (!statuses || Object.keys(statuses).length === 0) {
      return "Нет данных";
    }

    const planKeys = [
      "P1_Status",
      "P1_Gen_Status",
      "P2_Status",
      "P2_Gen_Status",
      "P3_Status",
      "P3_Gen_Status",
      "F1_Status",
      "F1_Gen_Status",
    ];

    const planAbbreviations = {
      P1_Status: "П1",
      P1__GenStatus: "ГП1",
      P2_Status: "П2",
      P2__GenStatus: "ГП2",
      P3_Status: "П3",
      P3__GenStatus: "ГП3",
      F1_Status: "Ф",
      F1__GenStatus: "ГФ1",
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

  // Filter objects for the chosen subject
  const objects = objectsList.filter(
    (object) => object.subject === selectedData.selectedSubject
  );

  // Set default selected object if not set
  useEffect(() => {
    if (!selectedData.selectedObject && objects.length > 0) {
      setSelectedData((prevData) => ({
        ...prevData,
        selectedObject: objects[0]?.id || 0,
      }));
    }
  }, [selectedData.selectedSubject, objects, setSelectedData]);

  // ***********************************************
  // Calculate sum and average for each column
  // ***********************************************
  const rowCount = hourPlan.length;
  const sumP1 = hourPlan.reduce((acc, row) => acc + (Number(row.P1) || 0), 0);
  const sumP1Gen =
    selectedObject && selectedObject.object_type !== "CONSUMER"
      ? hourPlan.reduce((acc, row) => acc + (Number(row.P1_Gen) || 0), 0)
      : 0;
  const sumP2 = hourPlan.reduce((acc, row) => acc + (Number(row.P2) || 0), 0);
  const sumP2Gen =
    selectedObject && selectedObject.object_type !== "CONSUMER"
      ? hourPlan.reduce((acc, row) => acc + (Number(row.P2_Gen) || 0), 0)
      : 0;
  const sumP3 = hourPlan.reduce((acc, row) => acc + (Number(row.P3) || 0), 0);
  const sumP3Gen =
    selectedObject && selectedObject.object_type !== "CONSUMER"
      ? hourPlan.reduce((acc, row) => acc + (Number(row.P3_Gen) || 0), 0)
      : 0;
  const sumF1 = hourPlan.reduce((acc, row) => acc + (Number(row.F1) || 0), 0);
  const sumF1Gen =
    selectedObject && selectedObject.object_type !== "CONSUMER"
      ? hourPlan.reduce((acc, row) => acc + (Number(row.F1_Gen) || 0), 0)
      : 0;

  const avgP1 = rowCount ? sumP1 / rowCount : 0;
  const avgP1Gen =
    selectedObject && selectedObject.object_type !== "CONSUMER"
      ? (rowCount ? sumP1Gen / rowCount : 0)
      : 0;
  const avgP2 = rowCount ? sumP2 / rowCount : 0;
  const avgP2Gen =
    selectedObject && selectedObject.object_type !== "CONSUMER"
      ? (rowCount ? sumP2Gen / rowCount : 0)
      : 0;
  const avgP3 = rowCount ? sumP3 / rowCount : 0;
  const avgP3Gen =
    selectedObject && selectedObject.object_type !== "CONSUMER"
      ? (rowCount ? sumP3Gen / rowCount : 0)
      : 0;
  const avgF1 = rowCount ? sumF1 / rowCount : 0;
  const avgF1Gen =
    selectedObject && selectedObject.object_type !== "CONSUMER"
      ? (rowCount ? sumF1Gen / rowCount : 0)
      : 0;
  // ***********************************************

  return (
    <>
      {/* Status Table */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th>Объект</th>
            {objects.map((object) => (
              <th key={object.id}>{object.object_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border" scope="row">
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
                  : generateStatusDisplayComponents(statusMap[object.id])}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Plan Table */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th></th>
            <th>
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
              >
                📝
              </button>
            </th>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <th>
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
                >
                  📝
                </button>
              </th>
            )}
            <th>П2</th>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <th>ГП2</th>
            )}
            <th>П3</th>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <th>ГП3</th>
            )}
            <th>Ф1</th>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <th>ГФ1</th>
            )}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              <td className="border">{time}</td>
              <td className="border">{hourPlan[index]?.P1 || 0}</td>
              {selectedObject && selectedObject.object_type !== "CONSUMER" && (
                <td className="border">{hourPlan[index]?.P1_Gen || 0}</td>
              )}
              <td className="border">{hourPlan[index]?.P2 || 0}</td>
              {selectedObject && selectedObject.object_type !== "CONSUMER" && (
                <td className="border">{hourPlan[index]?.P2_Gen || 0}</td>
              )}
              <td className="border">{hourPlan[index]?.P3 || 0}</td>
              {selectedObject && selectedObject.object_type !== "CONSUMER" && (
                <td className="border">{hourPlan[index]?.P3_Gen || 0}</td>
              )}
              <td className="border">{hourPlan[index]?.F1 || 0}</td>
              {selectedObject && selectedObject.object_type !== "CONSUMER" && (
                <td className="border">{hourPlan[index]?.F1_Gen || 0}</td>
              )}
            </tr>
          ))}
          {/* New Summary Rows */}
          <tr>
            <td className="border font-bold">Сумма</td>
            <td className="border">{sumP1}</td>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <td className="border">{sumP1Gen.toFixed(2)}</td>
            )}
            <td className="border">{sumP2.toFixed(2)}</td>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <td className="border">{sumP2Gen.toFixed(2)}</td>
            )}
            <td className="border">{sumP3}</td>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <td className="border">{sumP3Gen}</td>
            )}
            <td className="border">{sumF1}</td>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <td className="border">{sumF1Gen}</td>
            )}
          </tr>
          <tr>
            <td className="border font-bold">Среднее</td>
            <td className="border">{avgP1.toFixed(2)}</td>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <td className="border">{avgP1Gen.toFixed(2)}</td>
            )}
            <td className="border">{avgP2.toFixed(2)}</td>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <td className="border">{avgP2Gen.toFixed(2)}</td>
            )}
            <td className="border">{avgP3.toFixed(2)}</td>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <td className="border">{avgP3Gen.toFixed(2)}</td>
            )}
            <td className="border">{avgF1.toFixed(2)}</td>
            {selectedObject && selectedObject.object_type !== "CONSUMER" && (
              <td className="border">{avgF1Gen.toFixed(2)}</td>
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

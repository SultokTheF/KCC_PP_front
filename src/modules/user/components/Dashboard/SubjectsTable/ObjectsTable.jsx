import { useState, useEffect } from "react";
import CreatePlanModal from "../CreatePlanModal/CreatePlanModal";

const timeIntervals = [
  '00 - 01',
  '01 - 02',
  '02 - 03',
  '03 - 04',
  '04 - 05',
  '05 - 06',
  '06 - 07',
  '07 - 08',
  '08 - 09',
  '09 - 10',
  '10 - 11',
  '11 - 12',
  '12 - 13',
  '13 - 14',
  '14 - 15',
  '15 - 16',
  '16 - 17',
  '17 - 18',
  '18 - 19',
  '19 - 20',
  '20 - 21',
  '21 - 22',
  '22 - 23',
  '23 - 00'
];

const ObjectTable = ({ selectedData, setSelectedData, objectsList, daysList, hoursList, selectedDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedObject = objectsList.find(object => object.id === selectedData.selectedObject);
  const dayPlan = daysList.find(day => day.object === selectedObject?.id && day.date.split('T')[0] === selectedDate.split('T')[0]);
  const hourPlan = hoursList.filter(hour => hour.day === dayPlan?.id);

  const [planData, setPlanData] = useState({
    planMode: "P1",
    isGen: false
  });

  const getStatus = (object) => {
    const day = daysList.find(day => day.object === object && day.date.split('T')[0] === selectedDate.split('T')[0]);

    if (day?.status === "PRIMARY_PLAN") {
      return "-П1-";
    } else if (day?.status === "KCCPP_PLAN") {
      return "-П1-П2-";
    } else if (day?.status === "KEGOS_PLAN") {
      return "-П1-П2-П3-";
    } else if (day?.status === "FACT1") {
      return "-П1-П2-П3-Ф-";
    } else if (day?.status === "FACT2") {
      return "-П1-П2-П3-Ф-";
    } else if (day?.status === "COMPLETED") {
      return "-П1-П2-П3-Ф-";
    }

    return "-";
  };

  const objects = objectsList.filter(object => object.subject === selectedData.selectedSubject);

  useEffect(() => {
    setSelectedData({
      ...selectedData,
      selectedObject: objects[0]?.id || 0
    });
  }, [selectedData.selectedSubject]);

  return (
    <>
      <table className="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-40 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th>{'Объект'}</th>
            {objects.map((object) => (
              <th key={object.id}>{object.object_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border w-1/12" scope="row">Статус</td>
            {objects.map((object) => (
              <td
                key={object.id}
                className={`border hover:bg-blue-100 cursor-pointer ${selectedData.selectedObject === object.id ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setSelectedData({
                  ...selectedData,
                  selectedObject: object.id
                })}
              >
                {getStatus(object.id)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <table className="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-40 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className={`w-[100px]`}></th>
            <th className={`w-[100px]`}>
              П1
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    ...planData,
                    planMode: "P1",
                    isGen: false
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === "ЭПО" && <th className={`w-[100px]`}>
              ГП1
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    ...planData,
                    planMode: "GP1",
                    isGen: true
                  });
                }}
              >
                📝
              </button>
            </th>}
            <th className={`w-[100px]`}>
              П2
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    ...planData,
                    planMode: "P2",
                    isGen: false
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === "ЭПО" && <th className={`w-[100px]`}>
              ГП2
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    ...planData,
                    planMode: "GP2",
                    isGen: true
                  });
                }}
              >
                📝
              </button>
            </th>}
            <th className={`w-[100px]`}>
              П3
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    ...planData,
                    planMode: "P3",
                    isGen: false
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === "ЭПО" && <th className={`w-[100px]`}>
              ГП3
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    ...planData,
                    planMode: "GP3",
                    isGen: true
                  });
                }}
              >
                📝
              </button>
            </th>}
            <th className={`w-[100px]`}>
              Ф
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    ...planData,
                    planMode: "F1",
                    isGen: false
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === "ЭПО" && <th className={`w-[100px]`}>
              ГФ
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    ...planData,
                    planMode: "GF1",
                    isGen: true
                  });
                }}
              >
                📝
              </button>
            </th>}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              <td className={`border`}>{time}</td>
              <td className={`border`}>{hourPlan[index]?.P1 || "-"}</td>
              {selectedObject?.object_type === "ЭПО" && <td className={`border`}>{hourPlan[index]?.P1_Gen || "-"}</td>}
              <td className={`border`}>{hourPlan[index]?.P2 || "-"}</td>
              {selectedObject?.object_type === "ЭПО" && <td className={`border`}>{hourPlan[index]?.P2_Gen || "-"}</td>}
              <td className={`border`}>{hourPlan[index]?.P3 || "-"}</td>
              {selectedObject?.object_type === "ЭПО" && <td className={`border`}>{hourPlan[index]?.P3_Gen || "-"}</td>}
              <td className={`border`}>{hourPlan[index]?.F1 || "-"}</td>
              {selectedObject?.object_type === "ЭПО" && <td className={`border`}>{hourPlan[index]?.F1_Gen || "-"}</td>}
            </tr>
          ))}
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
}

export default ObjectTable;

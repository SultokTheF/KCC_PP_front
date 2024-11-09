// src/components/Dashboard/ObjectsTable/ObjectTable.js
import React, { useState, useEffect } from 'react';
import useDataFetching from '../../../../../hooks/useDataFetching';
import CreatePlanModal from '../CreatePlanModal/CreatePlanModal';

const timeIntervals = [
  '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
  '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
  '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
  '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00',
];

const ObjectTable = ({ selectedData, setSelectedData, objectsList, selectedDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedObject = objectsList.find(object => object.id === selectedData.selectedObject);

  const { daysList, hoursList } = useDataFetching(selectedDate, selectedData.selectedObject, 'object');

  const dayPlan = daysList?.find(day => day.object === selectedObject?.id && day.date.split('T')[0] === selectedDate.split('T')[0]);
  const hourPlan = hoursList?.filter(hour => hour.day === dayPlan?.id);

  const [planData, setPlanData] = useState({
    planMode: 'P1',
    isGen: false,
  });

  const getStatus = (object) => {
    const day = daysList?.find(day => day.object === object.id && day.date.split('T')[0] === selectedDate.split('T')[0]);

    switch (day?.status) {
      case 'PRIMARY_PLAN':
        return '-П1-';
      case 'KCCPP_PLAN':
        return '-П1-П2-';
      case 'KEGOS_PLAN':
        return '-П1-П2-П3-';
      case 'FACT1':
      case 'FACT2':
      case 'COMPLETED':
        return '-П1-П2-П3-Ф-';
      default:
        return '-';
    }
  };

  const objects = objectsList.filter(object => object.subject === selectedData.selectedSubject);

  useEffect(() => {
    if (!selectedData.selectedObject && objects.length > 0) {
      setSelectedData(prevData => ({
        ...prevData,
        selectedObject: objects[0]?.id || 0,
      }));
    }
  }, [selectedData.selectedSubject, objects]);

  return (
    <>
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th>{'Объект'}</th>
            {objects.map(object => (
              <th key={object.id}>{object.object_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border" scope="row">Статус</td>
            {objects.map(object => (
              <td
                key={object.id}
                className={`border hover:bg-blue-100 cursor-pointer ${selectedData.selectedObject === object.id ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setSelectedData(prevData => ({
                  ...prevData,
                  selectedObject: object.id,
                }))}
              >
                {getStatus(object)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

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
                    planMode: 'P1',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГП1
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GP1',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
            <th>
              П2
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'P1',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГП2
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GP2',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
            <th>
              П3
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'P3',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГП3
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GP3',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
            <th>
              Ф
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'F1',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                Гф
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GF1',
                      isGen: true,
                    });
                  }}
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
              <td className="border">{time}</td>
              <td className="border">{hourPlan[index]?.P1 || '-'}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P1_Gen || '-'}</td>}
              <td className="border">{hourPlan[index]?.P2 || '-'}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P2_Gen || '-'}</td>}
              <td className="border">{hourPlan[index]?.P3 || '-'}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan[index]?.P3_Gen || '-'}</td>}
              <td className="border">{hourPlan[index]?.F1 || '-'}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan[index]?.F1_Gen || '-'}</td>}
              {/* Repeat for other columns... */}
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
};

export default ObjectTable;

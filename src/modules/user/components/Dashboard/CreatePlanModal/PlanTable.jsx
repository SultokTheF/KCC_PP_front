// PlanTable.js

import React, { useState, useEffect } from "react";

const PlanTable = ({ date, object, mode, handleTableChange, plansP }) => {
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

  const [plans, setPlans] = useState(Array(24).fill(''));

  const getPlanMode = (mode) => {
    switch (mode) {
      case 'P1':
        return 'P1';
      case 'P2':
        return 'P2';
      case 'P3':
        return 'P3';
      case 'F1':
        return 'F1';
      case 'GP1':
        return 'P1_Gen';
      case 'GP2':
        return 'P2_Gen';
      case 'GP3':
        return 'P3_Gen';
      case 'GF1':
        return 'F1_Gen';
      default:
        return 'P1';
    }
  }

  useEffect(() => {
    console.log('plansP:', plansP);
    console.log('mode:', mode);
    const updatedPlans = [];
    for (let i = 0; i < 24; i++) {
      let planValue = '';
      if (plansP[i] !== undefined && plansP[i] !== null) {
        if (typeof plansP[i] === 'object') {
          planValue = plansP[i][getPlanMode(mode)] || '';
        } else {
          planValue = plansP[i];
        }
      }
      updatedPlans.push(planValue);
    }
    setPlans(updatedPlans);
  }, [mode, plansP]);

  const handleChange = (index, value) => {
    const updatedPlans = [...plans];
    updatedPlans[index] = parseInt(value) || 0;
    setPlans(updatedPlans);
    handleTableChange(object, date, updatedPlans, mode);
  };

  return (
    <>
      <div className="relative overflow-x-auto sm:rounded-lg">
        <div>
          {timeIntervals.map((time, index) => (
            <React.Fragment key={index}>
              {index <= 11 && (
                <div className="flex text-gray-600 text-sm items-center justify-center">
                  <div className="border px-3 bg-gray-200 mx-3 my-1 rounded-lg text-center">
                    <label htmlFor={index}>{timeIntervals[index]}</label>
                    <input
                      className="h-full text-gray-900 rounded-sm mx-5 text-center"
                      id={index}
                      type="number"
                      value={plans[index]}
                      onChange={(e) => handleChange(index, e.target.value)}
                      min={0}
                      required
                    />
                    <label htmlFor={index}>МВт</label> <br />
                    {mode === "P1" && plansP[index]?.message !== "В ожидании" && <label className="text-orange-500" htmlFor={index}>{plansP[index]?.message}</label>}
                  </div>
                  <div className="border px-3 bg-gray-200 mx-3 my-1 rounded-lg text-center">
                    <label htmlFor={index + 12}>{timeIntervals[index + 12]}</label>
                    <input
                      className="h-full text-gray-900 rounded-sm mx-5 text-center"
                      id={index + 12}
                      type="number"
                      value={plans[index + 12]}
                      onChange={(e) => handleChange(index + 12, e.target.value)}
                      min={0}
                      required
                    />
                    <label htmlFor={index + 12}>МВт</label> <br />
                    {mode === "P1" && plansP[index + 12]?.message !== "В ожидании" && <label className="text-orange-500" htmlFor={index + 12}>{plansP[index + 12]?.message}</label>}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}

export default PlanTable;

// src/components/Dashboard/SubjectsTable/PlanTable.jsx
import React, { useState, useEffect } from "react";

const PlanTable = ({ date, object, mode, handleTableChange, plansP }) => {
  const timeIntervals = [
    "00 - 01", "01 - 02", "02 - 03", "03 - 04", "04 - 05", "05 - 06",
    "06 - 07", "07 - 08", "08 - 09", "09 - 10", "10 - 11", "11 - 12",
    "12 - 13", "13 - 14", "14 - 15", "15 - 16", "16 - 17", "17 - 18",
    "18 - 19", "19 - 20", "20 - 21", "21 - 22", "22 - 23", "23 - 00",
  ];

  // Local state for input fields.
  const [plans, setPlans] = useState(Array(24).fill(""));

  useEffect(() => {
    // On mount/update, fill the local state with the passed array (plansP).
    const updatedPlans = [];
    for (let i = 0; i < 24; i++) {
      updatedPlans.push(plansP[i] ?? 0);
    }
    setPlans(updatedPlans);
  }, [plansP]);

  const handleChange = (index, value) => {
    const updatedPlans = [...plans];
    updatedPlans[index] = parseInt(value) || 0;
    setPlans(updatedPlans);
    handleTableChange(object, date, updatedPlans, mode);
  };

  // Calculate the total sum of the plan values.
  const totalSum = plans.reduce((acc, curr) => acc + Number(curr), 0);

  return (
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
                  <label htmlFor={index}>КВт</label>
                </div>
                <div className="border px-3 bg-gray-200 mx-3 my-1 rounded-lg text-center">
                  <label htmlFor={index + 12}>
                    {timeIntervals[index + 12]}
                  </label>
                  <input
                    className="h-full text-gray-900 rounded-sm mx-5 text-center"
                    id={index + 12}
                    type="number"
                    value={plans[index + 12]}
                    onChange={(e) => handleChange(index + 12, e.target.value)}
                    min={0}
                    required
                  />
                  <label htmlFor={index + 12}>КВт</label>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* New sum display below the plan table */}
      <div className="mt-4 text-center text-lg font-bold">
        Сумма: {totalSum} КВт
      </div>
    </div>
  );
};

export default PlanTable;

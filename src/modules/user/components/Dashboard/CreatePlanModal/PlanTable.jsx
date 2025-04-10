import React, { useState, useEffect } from "react";

const PlanTable = ({ date, object, mode, handleTableChange, plansP }) => {
  // Hour interval labels (24 hours) split into two columns.
  const timeIntervals = [
    "00 - 01", "01 - 02", "02 - 03", "03 - 04", "04 - 05", "05 - 06",
    "06 - 07", "07 - 08", "08 - 09", "09 - 10", "10 - 11", "11 - 12",
    "12 - 13", "13 - 14", "14 - 15", "15 - 16", "16 - 17", "17 - 18",
    "18 - 19", "19 - 20", "20 - 21", "21 - 22", "22 - 23", "23 - 00",
  ];

  // Local state for the values of each hour.
  const [plans, setPlans] = useState(Array(24).fill(""));

  // Local state for the “Все часы” input field.
  const [allHoursValue, setAllHoursValue] = useState("");

  // When plansP changes (or on mount), update the local state with up to 24 values.
  useEffect(() => {
    const updatedPlans = [];
    for (let i = 0; i < 24; i++) {
      updatedPlans.push(plansP[i] ?? 0);
    }
    setPlans(updatedPlans);
  }, [plansP]);

  /**
   * Updates a single hour value.
   */
  const handleChange = (index, value) => {
    const updatedPlans = [...plans];
    updatedPlans[index] = parseInt(value) || 0;
    setPlans(updatedPlans);
    // Propagate the change so the parent form (PlanModal) remains in sync.
    handleTableChange(object, date, updatedPlans, mode);
  };

  /**
   * Sets every hour’s value to the number provided in the “Все часы” input.
   * This only fills the table (and updates the parent’s state) without pushing any data to the server.
   */
  const handleAllHoursClick = () => {
    // Convert the input value to a number (defaulting to 0 if conversion fails)
    const numericValue = parseInt(allHoursValue, 10) || 0;
    const updatedPlans = Array(24).fill(numericValue);
    setPlans(updatedPlans);
    // Update the parent form data so that these changes are included on submission.
    handleTableChange(object, date, updatedPlans, mode);
  };

  // Calculate the sum of all hour values to display the total.
  const totalSum = plans.reduce((acc, curr) => acc + Number(curr), 0);

  return (
    <div className="relative overflow-x-auto sm:rounded-lg">
      {/* “Все часы” feature: update the table with a single provided value */}
      <div className="flex items-center mb-4">
        <label className="mr-2 font-medium text-gray-700">Все часы:</label>
        <input
          type="number"
          value={allHoursValue}
          onChange={(e) => setAllHoursValue(e.target.value)}
          className="border rounded px-2 py-1 mr-2 w-20 focus:outline-none"
          placeholder="Значение"
        />
        <button
          onClick={handleAllHoursClick}
          className="border rounded px-4 py-1 bg-gray-200 hover:bg-gray-300"
          type="button"
        >
          Проставить
        </button>
      </div>

      {/* Render the 24-hour plan in two columns */}
      <div>
        {timeIntervals.map((time, index) => (
          <React.Fragment key={index}>
            {index <= 11 && (
              <div className="flex text-gray-600 text-sm items-center justify-center">
                <div className="border px-3 bg-gray-200 mx-3 my-1 rounded-lg text-center">
                  <label htmlFor={`plan-${index}`}>{timeIntervals[index]}</label>
                  <input
                    className="h-full text-gray-900 rounded-sm mx-5 text-center"
                    id={`plan-${index}`}
                    type="number"
                    value={plans[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    min={0}
                    required
                  />
                  <label htmlFor={`plan-${index}`}>КВт</label>
                </div>
                <div className="border px-3 bg-gray-200 mx-3 my-1 rounded-lg text-center">
                  <label htmlFor={`plan-${index + 12}`}>
                    {timeIntervals[index + 12]}
                  </label>
                  <input
                    className="h-full text-gray-900 rounded-sm mx-5 text-center"
                    id={`plan-${index + 12}`}
                    type="number"
                    value={plans[index + 12]}
                    onChange={(e) => handleChange(index + 12, e.target.value)}
                    min={0}
                    required
                  />
                  <label htmlFor={`plan-${index + 12}`}>КВт</label>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Display total sum */}
      <div className="mt-4 text-center text-lg font-bold">
        Сумма: {totalSum} КВт
      </div>
    </div>
  );
};

export default PlanTable;

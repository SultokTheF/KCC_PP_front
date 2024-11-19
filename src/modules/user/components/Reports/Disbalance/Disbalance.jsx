import React, { useState, useEffect, useCallback } from "react";
import DisbalanceTable from "./DisbalancsTable";
// import DisbalanceSum from "./DisbalanceSum";
import Sidebar from "../../Sidebar/Sidebar";
import { useAuth } from "../../../../../hooks/useAuth";

import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

// Moved timeIntervals to a separate module or include it here
const timeIntervals = [
  '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
  '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
  '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
  '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00',
];

const Disbalance = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    subject: '',
    planMode: 'P1',
    planModeGen: 'P1_Gen',
    factMode: 'F1',
    factModeGen: 'F1_Gen',
    dateArray: [],
  });

  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [objectHours, setObjectHours] = useState({});
  const [hoursList, setHoursList] = useState([]);

  // Fetch subjects and initialize data when subject changes
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch subjects
        const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
        const filteredSubjects = subjectsResponse.data.filter(subject => subject.users.includes(user.id));
        setSubjectsList(filteredSubjects);

        if (formData.subject) {
          // Fetch objects for the selected subject
          const objectsResponse = await axiosInstance.get(endpoints.OBJECTS, {
            params: {
              sub: formData.subject,
            },
          });

          const filteredObjects = objectsResponse.data.filter(object => object.users.includes(user.id));
          setObjectsList(filteredObjects);

          // By default, select all objects
          const allObjectIds = objectsResponse.data.map((obj) => obj.id);
          setSelectedObjects(allObjectIds);
        } else {
          // Reset data if no subject is selected
          setObjectsList([]);
          setSelectedObjects([]);
          setObjectHours({});
          setHoursList([]);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [formData.subject]);

  // Fetch hours data when date range or selected objects change
  const fetchHoursData = useCallback(async () => {
    try {
      if (!formData.subject || !formData.date_from || !formData.date_to) {
        setHoursList([]);
        return;
      }

      // Generate date array
      const dateArray = generateDateArray(formData.date_from, formData.date_to);

      setFormData((prevData) => ({
        ...prevData,
        dateArray: dateArray,
      }));

      const totalDays = dateArray.length;
      const totalHours = totalDays * 24;

      // Fetch hours for each object
      const hoursPromises = selectedObjects.map((objId) =>
        axiosInstance
          .get(endpoints.HOURS, {
            params: {
              obj: objId,
              start_date: formData.date_from,
              end_date: formData.date_to,
            },
          })
          .then((response) => {
            const hours = response.data;

            // Process hours to include date and time
            const hoursWithDateTime = hours.map((hourData, index) => {
              const dayIndex = Math.floor(index / 24);
              const hourIndex = index % 24;

              // Safeguard against index out of bounds
              const date = dateArray[dayIndex] || formData.date_from;
              const time = timeIntervals[hourIndex] || timeIntervals[0];

              return {
                ...hourData,
                date: hourData.date || date,
                time: hourData.time || time,
              };
            });

            return { status: 'fulfilled', objId, hours: hoursWithDateTime };
          })
          .catch((error) => {
            console.warn(`Error fetching hours for object ${objId}, setting hours to zeros.`);
            const zeros = [];
            let currentDate = new Date(formData.date_from);
            for (let day = 0; day < totalDays; day++) {
              const dateString = currentDate.toISOString().split('T')[0];
              for (let hour = 1; hour <= 24; hour++) {
                zeros.push({
                  hour: hour,
                  time: timeIntervals[hour - 1],
                  date: dateString,
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
                  BE_Up: 0,
                  BE_Down: 0,
                  OD_Up: 0,
                  OD_Down: 0,
                });
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
            return { status: 'rejected', objId, hours: zeros };
          })
      );

      const hoursResults = await Promise.all(hoursPromises);

      const newObjectHours = {};
      hoursResults.forEach(({ objId, hours }) => {
        newObjectHours[objId] = hours;
      });
      setObjectHours(newObjectHours);

      // Sum up the hours for selected objects
      const totalHoursList = sumHoursForSelectedObjects(newObjectHours);
      setHoursList(totalHoursList);
    } catch (error) {
      console.error('Error fetching hours data:', error);
    }
  }, [formData.date_from, formData.date_to, formData.subject, selectedObjects]);

  useEffect(() => {
    fetchHoursData();
  }, [fetchHoursData]);

  // Handle object selection
  const handleObjectSelection = (e) => {
    const value = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedObjects((prev) => [...prev, value]);
    } else {
      setSelectedObjects((prev) => prev.filter((id) => id !== value));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(endpoints.DISBALANSE_CREATE, {
        subject_id: formData.subject,
        object_ids: selectedObjects,
        plan: formData.planMode,
        fact: formData.factMode,
        plan_gen: formData.planModeGen,
        fact_gen: formData.factModeGen,
        date_from: formData.date_from,
        date_to: formData.date_to,
        is_submitted: true,
      });
      // Refetch hours data to refresh the table
      fetchHoursData();
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

  // Generate date array
  const generateDateArray = (startDate, endDate) => {
    const dateArray = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dateArray.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
  };

  // Function to sum hours for selected objects
  const sumHoursForSelectedObjects = (objectHoursData) => {
    const totalHoursList = [];

    // Check if there is any data
    if (Object.keys(objectHoursData).length === 0) {
      return [];
    }

    // Get the list of object IDs
    const objIds = Object.keys(objectHoursData);

    // Get the total number of records (assuming all objects have the same length)
    const totalRecords = objectHoursData[objIds[0]].length;

    for (let i = 0; i < totalRecords; i++) {
      const aggregatedHour = {};
      let dateSet = false;
      let timeSet = false;

      objIds.forEach((objId) => {
        const objHours = objectHoursData[objId];
        if (objHours && objHours[i]) {
          const hourData = objHours[i];
          for (const field in hourData) {
            if (typeof hourData[field] === 'number') {
              aggregatedHour[field] = (aggregatedHour[field] || 0) + hourData[field];
            } else {
              // For 'date' and 'time', set them if not already set
              if (!dateSet && field === 'date' && hourData[field]) {
                aggregatedHour[field] = hourData[field];
                dateSet = true;
              }
              if (!timeSet && field === 'time' && hourData[field]) {
                aggregatedHour[field] = hourData[field];
                timeSet = true;
              }
            }
          }
        }
      });

      // Fallback for 'date' and 'time' if they are still undefined
      if (!aggregatedHour['date']) {
        aggregatedHour['date'] = 'Unknown Date';
      }
      if (!aggregatedHour['time']) {
        aggregatedHour['time'] = 'Unknown Time';
      }

      totalHoursList.push(aggregatedHour);
    }

    return totalHoursList;
  };

  return (
    <div className="flex max-h-screen">
      <Sidebar />
      <div className="w-full flex mx-auto p-6">
        {/* Left Side: Selectors */}
        <div className="w-1/3 bg-white rounded shadow-lg p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              {/* Subject Selector */}
              <div>
                <label htmlFor="subject" className="block text-gray-700 font-semibold mb-2">
                  Выберите Субъект
                </label>
                <select
                  name="subject"
                  id="subject"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  value={formData.subject}
                  onChange={(e) => {
                    const subjectId = parseInt(e.target.value);
                    setFormData((prevData) => ({
                      ...prevData,
                      subject: subjectId,
                    }));
                    setSelectedObjects([]); // Reset selected objects when subject changes
                    setObjectHours({});
                    setHoursList([]);
                  }}
                  required
                >
                  <option value="">Субъект</option>
                  {subjectsList.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Objects List */}
              {objectsList.length > 0 && (
                <div className="mt-4">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Выберите Объекты
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2 space-y-1">
                    {objectsList.map((obj) => (
                      <div key={obj.id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={obj.id}
                          checked={selectedObjects.includes(obj.id)}
                          onChange={handleObjectSelection}
                          className="mr-2"
                        />
                        <label>{obj.object_name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range Selectors */}
              <div>
                <label htmlFor="date_from" className="block text-gray-700 font-semibold mb-2">
                  Дата начала
                </label>
                <input
                  type="date"
                  name="date_from"
                  id="date_from"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  value={formData.date_from}
                  onChange={(e) =>
                    setFormData((prevData) => ({
                      ...prevData,
                      date_from: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor="date_to" className="block text-gray-700 font-semibold mb-2">
                  Дата конца
                </label>
                <input
                  type="date"
                  name="date_to"
                  id="date_to"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  value={formData.date_to}
                  onChange={(e) =>
                    setFormData((prevData) => ({
                      ...prevData,
                      date_to: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {/* Plan and Fact Selectors */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="planMode" className="block text-gray-700 font-semibold mb-2">
                    План
                  </label>
                  <select
                    name="planMode"
                    id="planMode"
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                    value={formData.planMode}
                    onChange={(e) =>
                      setFormData((prevData) => ({
                        ...prevData,
                        planMode: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="P1">Первичный план (P1)</option>
                    <option value="P2">План KCC PP (P2)</option>
                    <option value="P3">План KEGOC (P3)</option>
                    <option value="F1">Факт оперативный (F1)</option>
                    <option value="F2">Факт KEGOC (F2)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="factMode" className="block text-gray-700 font-semibold mb-2">
                    Факт
                  </label>
                  <select
                    name="factMode"
                    id="factMode"
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                    value={formData.factMode}
                    onChange={(e) =>
                      setFormData((prevData) => ({
                        ...prevData,
                        factMode: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="P1">Первичный план (P1)</option>
                    <option value="P2">План KCC PP (P2)</option>
                    <option value="P3">План KEGOC (P3)</option>
                    <option value="F1">Факт оперативный (F1)</option>
                    <option value="F2">Факт KEGOC (F2)</option>
                  </select>
                </div>
              </div>

              {/* Plan Generation and Fact Generation Selectors */}
              {(["ЭПО", "ВИЭ", "ГП"].includes(subjectsList.find((subj) => subj.id === formData.subject)?.subject_type) && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="planModeGen" className="block text-gray-700 font-semibold mb-2">
                      План Генерации
                    </label>
                    <select
                      name="planModeGen"
                      id="planModeGen"
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.planModeGen}
                      onChange={(e) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          planModeGen: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="P1_Gen">Первичный план генерации (P1)</option>
                      <option value="P2_Gen">План генерации KCC PP (P2)</option>
                      <option value="P3_Gen">План генерации KEGOC (P3)</option>
                      <option value="F1_Gen">Факт генерации оперативный (F1)</option>
                      <option value="F2_Gen">Факт генерации KEGOC (F2)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="factModeGen" className="block text-gray-700 font-semibold mb-2">
                      Факт Генерации
                    </label>
                    <select
                      name="factModeGen"
                      id="factModeGen"
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.factModeGen}
                      onChange={(e) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          factModeGen: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="P1_Gen">Первичный план генерации</option>
                      <option value="P2_Gen">План генерации KCC PP</option>
                      <option value="P3_Gen">План генерации KEGOC</option>
                      <option value="F1_Gen">Факт генерации оперативный</option>
                      <option value="F2_Gen">Факт генерации KEGOC</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* Right Side: Tables and Disbalance Sum */}
        <div className="w-2/3 p-6">

          <div className="h-[calc(100vh-20rem)] overflow-y-auto">
            <DisbalanceTable
              formData={formData}
              subjectsList={subjectsList}
              hoursList={hoursList}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disbalance;

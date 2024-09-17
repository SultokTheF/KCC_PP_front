import React, { useState, useEffect } from "react";
import DisbalanceTable from "./DisbalancsTable";
import DisbalanceSum from "./DisbalanceSum";
import Sidebar from "../../Sidebar/Sidebar";

import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

const Disbalance = () => {
  const [formData, setFormData] = useState({
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    subject: '',
    planMode: 'P1',
    planModeGen: 'P1_Gen',
    factMode: 'F1',
    factModeGen: 'F1_Gen',
    plan: [],
    fact: [],
    dateArray: [],
  });

  const [subjectsList, setSubjectsList] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [daysList, setDaysList] = useState([]);
  const [hoursList, setHoursList] = useState([]);

  const fetchData = async () => {
    try {
      // Fetch subjects
      const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
      setSubjectsList(subjectsResponse.data);

      if (formData.subject) {
        // Fetch objects for the selected subject
        const objectsResponse = await axiosInstance.get(endpoints.OBJECTS, {
          params: {
            sub: formData.subject,
          },
        });
        setObjectsList(objectsResponse.data);

        // By default, select all objects
        if (selectedObjects.length === 0) {
          const allObjectIds = objectsResponse.data.map((obj) => obj.id);
          setSelectedObjects(allObjectIds);
        }

        // Fetch hours and days based on selected objects
        if (selectedObjects.length > 0 && formData.date_from && formData.date_to) {
          const hoursResponse = await axiosInstance.get(endpoints.HOURS, {
            params: {
              obj: selectedObjects.join(','),
              start_date: formData.date_from,
              end_date: formData.date_to,
            },
          });
          const daysResponse = await axiosInstance.get(endpoints.DAYS, {
            params: {
              obj: selectedObjects.join(','),
              start_date: formData.date_from,
              end_date: formData.date_to,
            },
          });

          setDaysList(daysResponse.data);
          setHoursList(hoursResponse.data);
        } else {
          setDaysList([]);
          setHoursList([]);
        }
      } else {
        // Reset data if no subject is selected
        setObjectsList([]);
        setSelectedObjects([]);
        setDaysList([]);
        setHoursList([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [formData.subject, formData.date_from, formData.date_to, selectedObjects]);

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
      fetchData();
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

  useEffect(() => {
    const dateArray = generateDateArray(formData.date_from, formData.date_to);
    setFormData((prevData) => ({
      ...prevData,
      dateArray: dateArray,
    }));
  }, [formData.date_from, formData.date_to]);

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
                    <option value="P1">Первичный план</option>
                    <option value="P2">План KCC PP</option>
                    <option value="P3">План KEGOC</option>
                    <option value="F1">Факт</option>
                    <option value="F2">Факт 2</option>
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
                    <option value="P1">Первичный план</option>
                    <option value="P2">План KCC PP</option>
                    <option value="P3">План KEGOC</option>
                    <option value="F1">Факт</option>
                    <option value="F2">Факт 2</option>
                  </select>
                </div>
              </div>

              {/* Plan Generation and Fact Generation Selectors */}
              {subjectsList.find((subj) => subj.id === formData.subject)?.subject_type === "ЭПО" && (
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
                      <option value="P1_Gen">Первичный план</option>
                      <option value="P2_Gen">План KCC PP</option>
                      <option value="P3_Gen">План KEGOC</option>
                      <option value="F1_Gen">Факт Генерации</option>
                      <option value="F2_Gen">Факт 2 Генерации</option>
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
                      <option value="P1_Gen">Первичный план</option>
                      <option value="P2_Gen">План KCC PP</option>
                      <option value="P3_Gen">План KEGOC</option>
                      <option value="F1_Gen">Факт Генерации</option>
                      <option value="F2_Gen">Факт 2 Генерации</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition-colors duration-200"
              >
                Отправить
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Tables and Disbalance Sum */}
        <div className="w-2/3 p-6">
          <div className="mb-10">
            <DisbalanceSum formData={formData} selectedObjects={selectedObjects} />
          </div>

          <div className="h-[calc(100vh-20rem)] overflow-y-auto">
            <DisbalanceTable
              formData={formData}
              daysList={daysList}
              subjectsList={subjectsList}
              hoursList={hoursList}
              setFormData={setFormData}
              selectedObjects={selectedObjects}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disbalance;

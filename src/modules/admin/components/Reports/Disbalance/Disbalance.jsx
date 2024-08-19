import React, { useState, useEffect } from "react";
import DisbalanceTable from "./DisbalancsTable";
import DisbalanceSum from "./DisbalanceSum";
import Sidebar from "../../Sidebar/Sidebar";

import { axiosInstance } from "../../../../../services/apiConfig";

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
    dateArray: [], // Add this line to store the date array
  });

  const [subjectsList, setSubjectsList] = useState([]);
  const [daysList, setDaysList] = useState([]);
  const [hoursList, setHoursList] = useState([]);

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const [subjectsResponse, daysResponse, hoursResponse] = await Promise.all([
        axiosInstance.get('api/subjects/', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axiosInstance.get('api/days/', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axiosInstance.get('api/hours/', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      setSubjectsList(subjectsResponse.data);
      setDaysList(daysResponse.data);
      setHoursList(hoursResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('accessToken');

      const selectedDay = daysList.find(
        (day) => day.subject === formData.subject && day.date.split('T')[0] === formData.date
      );

      // if (!selectedDay) {
      //   console.error('Selected day not found');
      //   return;
      // }

      const response = await axiosInstance.post(
        `/api/days/disbalanceCreate/`,
        {
          subject_id: formData.subject,
          plan: formData.planMode,
          fact: formData.factMode,
          plan_gen: formData.planModeGen,
          fact_gen: formData.factModeGen,
          date_from: formData.date_from,
          date_to: formData.date_to,
          is_submitted: true
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      fetchData();

      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

  // Helper function to generate array of dates
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

  // Update dateArray when date_from or date_to changes
  useEffect(() => {
    const dateArray = generateDateArray(formData.date_from, formData.date_to);
    setFormData((prevData) => ({
      ...prevData,
      dateArray: dateArray,
    }));
  }, [formData.date_from, formData.date_to]);

  return (
    <div className="max-h-screen flex">
      <Sidebar />
      <div className="container w-screen-lg mx-auto">
        <div className="bg-white rounded shadow-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4 flex">
              <div className="w-1/2">
                <div className="flex-1">
                  <div className="mx-2">
                    <label htmlFor="subject" className="block text-gray-700 font-medium my-2">
                      Выберите Субъект
                    </label>
                    <select
                      name="subject"
                      id="subject"
                      className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-11/12 text-gray-700 font-medium mb-2"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          subject: parseInt(e.target.value),
                        }))
                      }
                      required
                    >
                      <option value={0}>Субъект</option>
                      {subjectsList?.map((subj) => (
                        <option key={subj.id} value={subj.id}>
                          {subj.subject_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-1">
                    <div className="mx-2">
                      <label htmlFor="date_from" className="block text-gray-700 font-medium my-2">
                        Выберите дату начала
                      </label>
                      <input
                        type="date"
                        name="date_from"
                        id="date_from"
                        className="h-10 border border-gray-300 rounded px-4 focus:outline-none focus:border-blue-500"
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
                  </div>

                  <div className="flex-1">
                    <div className="mx-2">
                      <label htmlFor="date_to" className="block text-gray-700 font-medium my-2">
                        Выберите дату конца
                      </label>
                      <input
                        type="date"
                        name="date_to"
                        id="date_to"
                        className="h-10 border border-gray-300 rounded px-4 focus:outline-none focus:border-blue-500"
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
                  </div>
                </div>
                <div className="flex">
                  <div className="w-3/4 mx-2">
                    <label htmlFor="planMode" className="block text-gray-700 font-medium my-2">
                      Выберите План
                    </label>
                    <select
                      name="planMode"
                      id="planMode"
                      className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-full text-gray-700 font-medium mb-2"
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
                    </select>
                  </div>

                  <div className="w-3/4 mx-2">
                    <label htmlFor="factMode" className="block text-gray-700 font-medium my-2">
                      Выберите Факт
                    </label>
                    <select
                      name="factMode"
                      id="factMode"
                      className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-full text-gray-700 font-medium mb-2"
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

                {subjectsList.find((subj) => subj.id === formData.subject)?.subject_type === "ЭПО" && (
                  <div className="flex">
                    <div className="w-3/4 mx-2">
                      <label htmlFor="planMode" className="block text-gray-700 font-medium my-2">
                        Выберите План Генерации
                      </label>
                      <select
                        name="planMode"
                        id="planMode"
                        className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-full text-gray-700 font-medium mb-2"
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
                        <option value="F1_Gen">Факт</option>
                        <option value="F2_Gen">Факт</option>
                      </select>
                    </div>

                    <div className="w-3/4 mx-2">
                      <label htmlFor="factMode" className="block text-gray-700 font-medium my-2">
                        Выберите Факт Генерации
                      </label>
                      <select
                        name="factMode"
                        id="factMode"
                        className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-full text-gray-700 font-medium mb-2"
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
                        <option value="F_Gen">Факт</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white font-medium py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Отправить
                  </button>
                </div>
              </div>

              <div className="w-3/4">
                <div className="mb-5">
                  <DisbalanceSum
                    formData={formData}
                    daysList={daysList}
                  />
                </div>
                <div className="h-[calc(100vh-9rem)] overflow-y-auto">
                  <DisbalanceTable
                    formData={formData}
                    subjectsList={subjectsList}
                    daysList={daysList}
                    hoursList={hoursList}
                    setFormData={setFormData} // Add this to allow FormsTable to update formData
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Disbalance;

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
  const [daysList, setDaysList] = useState([]);
  const [hoursList, setHoursList] = useState([]);

  const fetchData = async () => {
    try {

      const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
      setSubjectsList(subjectsResponse.data);

      if (formData.subject && formData.date_from && formData.date_to) {
        const hoursResponse = await axiosInstance.get(endpoints.HOURS, {
          params: {
            sub: formData.subject,
            start_date: formData.date_from,
            end_date: formData.date_to,
          },
        });
        const daysResponse = await axiosInstance.get(endpoints.DAYS, {
          params: {
            sub: formData.subject,
            start_date: formData.date_from,
            end_date: formData.date_to,
          },
        });

        setDaysList(daysResponse.data);
        setHoursList(hoursResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [formData.subject, formData.date_from, formData.date_to]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post(
        endpoints.DISBALANSE_CREATE,
        {
          subject_id: formData.subject,
          plan: formData.planMode,
          fact: formData.factMode,
          plan_gen: formData.planModeGen,
          fact_gen: formData.factModeGen,
          date_from: formData.date_from,
          date_to: formData.date_to,
          is_submitted: true,
        }
      );
      fetchData();
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

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
        <div className="w-1/3 bg-white rounded shadow-lg p-6">
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
                  onChange={(e) =>
                    setFormData((prevData) => ({
                      ...prevData,
                      subject: parseInt(e.target.value),
                    }))
                  }
                  required
                >
                  <option value={0}>Субъект</option>
                  {subjectsList.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.subject_name}
                    </option>
                  ))}
                </select>
              </div>

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
                    <option value="P1_Gen">Первичный план</option>
                    <option value="P2_Gen">План KCC PP</option>
                    <option value="P3_Gen">План KEGOC</option>
                    <option value="F1_Gen">Факт Генерации</option>
                    <option value="F2_Gen">Факт 2 Генерации</option>
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
                    <option value="P1_Gen">Первичный план</option>
                    <option value="P2_Gen">План KCC PP</option>
                    <option value="P3_Gen">План KEGOC</option>
                    <option value="F1_Gen">Факт Генерации</option>
                    <option value="F2_Gen">Факт 2 Генерации</option>
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
                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600"
              >
                Отправить
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Tables and Disbalance Sum */}
        <div className="w-2/3 p-6">
          <div className="mb-10">
            <DisbalanceSum formData={formData} />
          </div>

          <div className="h-[calc(100vh-20rem)] overflow-y-auto">
            <DisbalanceTable formData={formData} daysList={daysList} subjectsList={subjectsList} hoursList={hoursList} setFormData={setFormData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disbalance;

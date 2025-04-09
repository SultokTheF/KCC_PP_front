/* eslint-disable react/prop-types */
// src/components/Dashboard/SubjectsTable/PlanModal.jsx

import { useState, useEffect } from "react";
import { Button } from "@material-tailwind/react";
import Modal from "react-modal";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import {
  utils as XLSXUtils,
  writeFile as XLSXWriteFile,
  read as XLSXRead,
} from "xlsx";
import PlanTable from "./PlanTable";

Modal.setAppElement("#root");

const PlanModal = ({
  isOpen,
  closeModal,
  selectedDate,
  selectedObject,
  objectList,
  plans, // no longer used for submission logic
  planMode,
}) => {
  const [importedData, setImportedData] = useState(null);
  const [textareaInput, setTextareaInput] = useState("");

  // New state to hold the fetched plan data for the current object/date/mode.
  const [existingPlan, setExistingPlan] = useState([]);

  // Form data state which is initialized based on the props.
  const [formData, setFormData] = useState({
    object: selectedObject?.id || 0,
    date: selectedDate.split("T")[0] || new Date().toISOString().split("T")[0],
    plan: [],
    mode: planMode,
  });

  // On mount or when these props change, initialize the form data.
  useEffect(() => {
    const sortedPlans = Array.isArray(plans)
      ? [...plans].sort((a, b) => a.hour - b.hour)
      : [];
    const mappedPlan = sortedPlans.map((hourItem) => hourItem[planMode] ?? 0);
    setFormData({
      object: selectedObject?.id || 0,
      date: selectedDate.split("T")[0],
      plan: mappedPlan,
      mode: planMode,
    });
  }, [selectedDate, selectedObject, planMode, plans]);

  // Fetch the current plan data based on the selected object, date, and mode.
  // We also update the new existingPlan state.
  useEffect(() => {
    if (formData.object && formData.date && formData.mode) {
      axiosInstance
        .get(endpoints.HOURS, {
          params: { day: formData.date, obj: formData.object },
        })
        .then((response) => {
          const objectHours = response.data || [];
          const sortedHours = objectHours.sort((a, b) => a.hour - b.hour);
          const mappedPlan = sortedHours.map(
            (hour) => hour[formData.mode] ?? 0
          );
          setFormData((prevData) => ({
            ...prevData,
            plan: mappedPlan,
          }));
          setExistingPlan(objectHours);
        })
        .catch((error) => {
          console.error("Error fetching plan for object", error);
          setFormData((prevData) => ({
            ...prevData,
            plan: Array(24).fill(0),
          }));
          setExistingPlan([]);
        });
    }
  }, [formData.object, formData.date, formData.mode]);

  const handleTableChange = (object, date, updatedPlans, mode) => {
    setFormData({
      object: object,
      date: date,
      plan: updatedPlans,
      mode: mode,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    // Ensure that we always have a 24-element plan.
    const finalPlan =
      formData.plan && formData.plan.length > 0
        ? formData.plan
        : Array(24).fill(0);

    try {
      // If the mode is P1 and no plan exists for the current object, create a new plan.
      if (
        formData.mode === "P1" &&
        (!existingPlan || existingPlan.length === 0)
      ) {
        const response = await axiosInstance.post(endpoints.DAYS, {
          object: formData.object,
          date: formData.date,
          P1: finalPlan,
        });
        if (response.status >= 200 && response.status < 300) {
          console.log("План успешно создан:", response.data);
          window.location.href = "/dashboard";
        }
      } else if (existingPlan && existingPlan.length > 0) {
        // Otherwise, update the existing plan record.
        const day = existingPlan[0]?.day;
        const response = await axiosInstance.post(endpoints.PLANS_CREATE(day), {
          plan: {
            [formData.mode]: finalPlan,
          },
        });
        if (response.status === 201) {
          console.log("План успешно обновлен:", response.data);
          window.location.href = "/dashboard";
        }
      } else {
        // Fallback: create a new plan record if no existing plan is found.
        const response = await axiosInstance.post(endpoints.DAYS, {
          object: formData.object,
          date: formData.date,
          [formData.mode]: finalPlan,
        });
        if (response.status >= 200 && response.status < 300) {
          console.log("План успешно создан (fallback):", response.data);
          window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      console.error("Ошибка при отправке плана:", error);
      if (error.response?.data?.error) {
        alert(error.response?.data?.error);
      } else if (error.response?.status === 500) {
        alert("Измените данные, вы отправляете такие же данные");
      } else {
        alert("Произошла ошибка при обработке запроса.");
      }
    }
  };

  const handleExport = () => {
    const { date, plan, mode } = formData;
    const slicedPlan = plan.slice(0, 24);
    const selectedObj = objectList.find((obj) => obj.id === formData.object);
    const workbook = XLSXUtils.book_new();
    const worksheetData = [
      [`Объект: ${selectedObj?.object_name || ""}`, `Дата: ${date}`, mode],
      ["Час", "Значение"],
      ...slicedPlan.map((value, index) => [index + 1, value]),
    ];
    const worksheet = XLSXUtils.aoa_to_sheet(worksheetData);
    XLSXUtils.book_append_sheet(workbook, worksheet, "PlanData");

    XLSXWriteFile(
      workbook,
      `${selectedObj?.object_name || "object"}_${date}_${mode}.xlsx`
    );
  };

  const handleImport = async () => {
    if (!importedData) {
      console.error("Файл для импорта не выбран.");
      return;
    }

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSXRead(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsedData = XLSXUtils.sheet_to_json(worksheet, { header: 1 });
        // Assume data starts at row 3.
        const planValues = parsedData
          .slice(2)
          .map((row) => Number(row[1]) || 0);
        setFormData((prevData) => ({
          ...prevData,
          plan: planValues,
        }));
      };

      fileReader.readAsArrayBuffer(importedData);
    } catch (error) {
      console.error("Ошибка при импорте данных:", error);
    }
  };

  const handleImportFromText = () => {
    const values = textareaInput
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter((item) => item !== "")
      .map(Number)
      .map((num) => (isNaN(num) ? 0 : num));

    const updatedPlan = Array.from(
      { length: 24 },
      (_, index) => values[index] || 0
    );
    setFormData((prevData) => ({
      ...prevData,
      plan: updatedPlan,
    }));
  };

  const handlePullFromP2 = () => {
    if (formData.mode === "P3") {
      const p2Plan = plans.map((hour) => hour.P2 || 0);
      setFormData((prevData) => ({
        ...prevData,
        plan: p2Plan,
      }));
    } else if (formData.mode === "P3_Gen") {
      const p2GenPlan = plans.map((hour) => hour.P2_Gen || 0);
      setFormData((prevData) => ({
        ...prevData,
        plan: p2GenPlan,
      }));
    }
  };

  const handlePullFromP3 = () => {
    if (formData.mode === "F1") {
      const p3Plan = plans.map((hour) => hour.P3 || 0);
      setFormData((prevData) => ({
        ...prevData,
        plan: p3Plan,
      }));
    } else if (formData.mode === "F1_Gen") {
      const p3GenPlan = plans.map((hour) => hour.P3_Gen || 0);
      setFormData((prevData) => ({
        ...prevData,
        plan: p3GenPlan,
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel="Plan Modal"
      className="Modal"
    >
      <div>
        <div className="h-screen flex items-center justify-center">
          <div className="container w-screen-lg mx-auto">
            <div className="bg-white rounded shadow-lg p-6">
              <div className="text-right">
                <button onClick={closeModal} className="text-xl font-bold">
                  ❌
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4 flex">
                  <div className="w-1/2 pr-4">
                    <label
                      htmlFor="object"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      Выберите объект
                    </label>
                    <select
                      name="object"
                      id="object"
                      className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-11/12 text-gray-700 font-medium mb-2"
                      value={formData.object}
                      onChange={(e) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          object: parseInt(e.target.value, 10),
                        }))
                      }
                      required
                    >
                      <option value={0}>Объект</option>
                      {objectList?.map((obj) => (
                        <option key={obj.id} value={obj.id}>
                          {obj.object_name}
                        </option>
                      ))}
                    </select>

                    <label
                      htmlFor="mode"
                      className="block text-gray-700 font-medium my-2"
                    >
                      План
                    </label>
                    <select
                      name="mode"
                      id="mode"
                      className="block h-10 border rounded focus:outline-none focus:border-blue-500 w-full text-gray-700 font-medium mb-2"
                      value={formData.mode}
                      onChange={(e) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          mode: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="P1">Первичный план</option>
                      {objectList.find((obj) => obj.id === formData.object)
                        ?.object_type !== "CONSUMER" &&
                        objectList.find((obj) => obj.id === formData.object)
                          ?.object_type !== "РЭК" && (
                          <option value="P1_Gen">
                            Первичный план Генерации
                          </option>
                        )}
                      <option value="P3">План KEGOC</option>
                      {objectList.find((obj) => obj.id === formData.object)
                        ?.object_type !== "CONSUMER" &&
                        objectList.find((obj) => obj.id === formData.object)
                          ?.object_type !== "РЭК" && (
                          <option value="P3_Gen">План Генерации KEGOC</option>
                        )}
                      <option value="F1">Факт</option>
                      {objectList.find((obj) => obj.id === formData.object)
                        ?.object_type !== "CONSUMER" &&
                        objectList.find((obj) => obj.id === formData.object)
                          ?.object_type !== "РЭК" && (
                          <option value="F1_Gen">Генерация Факт</option>
                        )}
                    </select>

                    {formData.mode === "P3" && (
                      <button
                        className="border rounded px-6 py-3 my-2 hover:bg-gray-300 w-full"
                        type="button"
                        onClick={handlePullFromP2}
                      >
                        Загрузить данные из P2
                      </button>
                    )}
                    {formData.mode === "P3_Gen" && (
                      <button
                        className="border rounded px-6 py-3 my-2 hover:bg-gray-300 w-full"
                        type="button"
                        onClick={handlePullFromP2}
                      >
                        Загрузить данные из P2_Gen
                      </button>
                    )}
                    {formData.mode === "F1" && (
                      <button
                        className="border rounded px-6 py-3 my-2 hover:bg-gray-300 w-full"
                        type="button"
                        onClick={handlePullFromP3}
                      >
                        Загрузить данные из P3
                      </button>
                    )}
                    {formData.mode === "F1_Gen" && (
                      <button
                        className="border rounded px-6 py-3 my-2 hover:bg-gray-300 w-full"
                        type="button"
                        onClick={handlePullFromP3}
                      >
                        Загрузить данные из P3_Gen
                      </button>
                    )}

                    <label
                      htmlFor="date"
                      className="block text-gray-700 font-medium my-2"
                    >
                      Выберите дату
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      className="h-10 border border-gray-300 rounded px-4 focus:outline-none focus:border-blue-500 w-full"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          date: e.target.value,
                        }))
                      }
                      required
                    />

                    <div className="w-full mr-5 my-4">
                      <label
                        htmlFor="file-input"
                        className="block text-gray-700 font-medium my-2"
                      >
                        Выберите файл для импорта
                      </label>
                      <input
                        type="file"
                        name="file-input"
                        id="file-input"
                        className="block w-full border border-gray-200 
                          shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 
                          dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400
                          file:me-4 file:bg-gray-50 file:border-0
                          file:py-3 file:px-4
                          dark:file:bg-neutral-700 dark:file:text-neutral-400"
                        onChange={(e) => setImportedData(e.target.files[0])}
                      />
                    </div>
                    <div className="flex">
                      <button
                        className="border rounded px-6 py-3 mr-2 hover:bg-gray-300 flex-1"
                        type="button"
                        onClick={handleImport}
                      >
                        Импорт
                      </button>
                      <button
                        className="border rounded px-6 py-3 ml-2 hover:bg-gray-300 flex-1"
                        type="button"
                        onClick={handleExport}
                      >
                        Экспорт
                      </button>
                    </div>

                    <div className="my-3">
                      <label
                        htmlFor="importArea"
                        className="block text-gray-700 font-medium my-2"
                      >
                        Введите значения для импорта
                      </label>
                      <textarea
                        className="border text-center w-full p-2 rounded"
                        name="importArea"
                        id="importArea"
                        cols={26}
                        rows={5}
                        value={textareaInput}
                        onChange={(e) => setTextareaInput(e.target.value)}
                        placeholder="Введите значения, разделенные пробелами, запятыми или переносами строки"
                      ></textarea>
                      <button
                        className="border p-3 w-full bg-gray-100 hover:bg-gray-300 rounded-lg mt-2"
                        type="button"
                        onClick={handleImportFromText}
                      >
                        Импорт из текста
                      </button>
                    </div>
                  </div>

                  <div className="w-1/2">
                    <PlanTable
                      date={formData.date}
                      object={formData.object}
                      mode={formData.mode}
                      plansP={formData.plan}
                      handleTableChange={handleTableChange}
                    />
                  </div>
                </div>

                <div className="lg:flex mt-5">
                  <Button
                    fullWidth
                    variant="gradient"
                    type="submit"
                    size="sm"
                    className="lg:w-full"
                  >
                    <span>Отправить</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PlanModal;

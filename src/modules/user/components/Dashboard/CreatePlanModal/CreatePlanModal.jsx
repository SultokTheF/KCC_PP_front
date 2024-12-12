// PlanModal.js

import React, { useState, useEffect } from "react";
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
  plans,
  planMode,
  isGen,
}) => {
  const [importedData, setImportedData] = useState(null);
  const [textareaInput, setTextareaInput] = useState("");

  const [formData, setFormData] = useState({
    object: selectedObject?.id || 0,
    date: selectedDate.split("T")[0] || new Date().toISOString().split("T")[0],
    plan: [],
    mode: planMode,
  });

  const handleTableChange = (object, date, updatedPlans, mode) => {
    // Directly trust updatedPlans. They should already be numeric values.
    setFormData({
      object: object,
      date: date,
      plan: updatedPlans,
      mode: mode,
    });
  };

  useEffect(() => {
    // Map the existing plan data for the chosen mode if `plans` is provided.
    // If `plans` is an array of objects like [{P1:10, P2:20, ...}, {P1:15, ...}], 
    // we extract the relevant plan based on `planMode`.
    const mappedPlan = Array.isArray(plans) && plans.length > 0
      ? plans.map((hour) => hour[planMode] ?? 0)
      : [];

    setFormData((prevData) => ({
      ...prevData,
      object: selectedObject?.id || 0,
      date:
        selectedDate.split("T")[0] || new Date().toISOString().split("T")[0],
      plan: mappedPlan,
      mode: planMode,
    }));
  }, [selectedDate, selectedObject, planMode, plans]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    // Use formData.plan directly as the final plan
    const finalPlan = formData.plan;

    try {
      if (formData.mode === "P1" && plans.length === 0) {
        // Sending P1 when no plans exist yet
        const response = await axiosInstance.post(endpoints.DAYS, {
          object: formData.object,
          date: formData.date,
          P1: finalPlan,
        });

        if (response.status >= 200 && response.status < 300) {
          console.log("План успешно создан:", response.data);
          window.location.href = "/dashboard";
        }

        console.log("Ответ API:", response.data);
      } else {
        // Sending other plans
        // We assume plans[0].day is available. If not, handle accordingly.
        const day = plans[0]?.day;
        const response = await axiosInstance.post(endpoints.PLANS_CREATE(day), {
          plan: {
            [formData.mode]: finalPlan,
          },
        });

        if (response.status === 201) {
          console.log("План успешно создан:", response.data);
          window.location.href = "/dashboard";
        }

        console.log("Ответ API:", response.data);
      }
    } catch (error) {
      console.error("Произошла ошибка при запросе к API:", error);
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
    const { object, date, plan, mode } = formData;

    // Slice the plan array to get only the first 24 elements
    const slicedPlan = plan.slice(0, 24);

    // Create a new workbook and worksheet
    const workbook = XLSXUtils.book_new();
    const worksheetData = [
      [`Объект: ${selectedObject?.object_name}`, `Дата: ${date}`, mode],
      ["Час", "Значение"],
      ...slicedPlan.map((value, index) => [index + 1, value]),
    ];
    const worksheet = XLSXUtils.aoa_to_sheet(worksheetData);

    // Add the worksheet to the workbook
    XLSXUtils.book_append_sheet(workbook, worksheet, "PlanData");

    // Generate the Excel file
    XLSXWriteFile(
      workbook,
      `${selectedObject?.object_name}_${date}_${mode}.xlsx`
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

        // Assuming that the data starts from row 3 (after headers)
        const planValues = parsedData.slice(2).map((row) => Number(row[1]) || 0);

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
    // Split the input by spaces, commas, or newlines
    const values = textareaInput
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter((item) => item !== "")
      .map(Number)
      .map((num) => (isNaN(num) ? 0 : num));

    // Ensure the plan has exactly 24 elements, filling missing with 0
    const updatedPlan = Array.from({ length: 24 }, (_, index) => values[index] || 0);

    setFormData((prevData) => ({
      ...prevData,
      plan: updatedPlan,
    }));
  };

  const handlePullFromP2 = () => {
    // When mode = P3 or P3_Gen, load data from P2 or P2_Gen respectively
    if (formData.mode === "P3") {
      const p2Plan = plans.map((hour) => hour.P2 || 0);
      setFormData((prevData) => ({
        ...prevData,
        plan: p2Plan,
      }));
    } else if (formData.mode === "P3_Gen") {
      // Load data from P2_Gen
      const p2GenPlan = plans.map((hour) => hour.P2_Gen || 0);
      setFormData((prevData) => ({
        ...prevData,
        plan: p2GenPlan,
      }));
    }
  };

  const handlePullFromP3 = () => {
    // When mode = F1 or F1_Gen, load data from P3 or P3_Gen respectively
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
                      {selectedObject?.object_type !== "CONSUMER" && (
                        <option value="P1_Gen">Первичный план Генерации</option>
                      )}
                      <option value="P3">План KEGOC</option>
                      {selectedObject?.object_type !== "CONSUMER" && (
                        <option value="P3_Gen">План Генерации KEGOC</option>
                      )}
                      <option value="F1">Факт</option>
                      {selectedObject?.object_type !== "CONSUMER" && (
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

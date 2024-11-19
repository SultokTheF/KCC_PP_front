import { useState, useEffect, useRef } from "react";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";
import * as XLSX from 'xlsx'; // Import the xlsx library

const timeIntervals = [
  '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
  '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
  '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
  '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00'
];

const SubjectTable = ({ selectedData, setSelectedData, subjectsList, daysList, hoursList, selectedDate }) => {
  const selectedSubject = subjectsList.find(subject => subject.id === selectedData.selectedSubject);
  const dayPlan = daysList?.find(day => day.subject === selectedSubject?.id && day.date.split('T')[0] === selectedDate.split('T')[0]) || null;

  // Initialize localHourPlan with hoursList data
  const [localHourPlan, setLocalHourPlan] = useState([]);

  const getPlanStatus = async (date, subject) => {
    const day = daysList?.find(day => day.subject === subject.id && day.date.split('T')[0] === date.split('T')[0]);
    if (day && day.status) {
      return statusMap[day.status] || "Нет данных";
    }
    try {
      const response = await axiosInstance.get(endpoints.GET_STATUS, {
        params: {
          date,
          subject: subject.id
        }
      });
      return response.data.status || "Нет данных";
    } catch (error) {
      // console.error(`Error fetching status for subject ${subject.id}:`, error);
      return "Нет данных";
    }
  };

  const [statusMap, setStatusMap] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    const fetchAllStatuses = async () => {
      setLoadingStatuses(true);
      setStatusError(null);
      const newStatusMap = {};

      try {
        const statusPromises = subjectsList.map(subject =>
          getPlanStatus(selectedDate, subject).then(status => ({
            id: subject.id,
            status
          }))
        );

        const statuses = await Promise.all(statusPromises);

        statuses.forEach(({ id, status }) => {
          newStatusMap[id] = status;
        });

        setStatusMap(newStatusMap);
      } catch (error) {
        setStatusError("Ошибка при загрузке статусов.");
        console.error("Error fetching statuses:", error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    if (selectedDate && subjectsList.length > 0) {
      fetchAllStatuses();
    }
  }, [selectedDate, subjectsList]);

  // Initialize localHourPlan with hoursList data
  useEffect(() => {
    const initialHourPlan = Array(24).fill({}).map((_, index) => {
      const hourData = hoursList.find(hour => hour.hour === index + 1); // Assuming hours are from 1 to 24
      return {
        hour: index + 1,
        P1: hourData?.P1 || 0,
        P1_Gen: hourData?.P1_Gen || 0,
        coefficient: hourData?.coefficient || 0,
        volume: hourData?.volume || 0,
        message: hourData?.message || '',
        P2_message: hourData?.P2_message || '',
        // Other fields as needed
      };
    });
    setLocalHourPlan(initialHourPlan);
  }, [hoursList]);

  const [showMessageCol, setShowMessageCol] = useState(false);
  const [showButtons, setShowButtons] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');

  const fileInputRef = useRef(null);

  // Status Display Map
  const statusDisplayMap = {
    "PRIMARY_PLAN": "-П1-",
    "KCCPP_PLAN": "-П1-П2",
    "KEGOS_PLAN": "-П1-П2-П3-",
    "FACT1": "-П1-П2-П3-Ф1",
    "FACT2": "-П1-П2-П3-Ф1-Ф2",
    "COMPLETED": "Завершен",
    "Ошибка при загрузке": "Нет данных",
    // ... add other statuses if necessary
  };

  // Remove the old getStatus function if it's no longer needed
  // const getStatus = (subject) => {
  //   const day = daysList?.find(day => day.subject === subject.id && day.date.split('T')[0] === selectedDate.split('T')[0]);
  //   return statusDisplayMap[day?.status] || "Нет данных";
  // };

  const handleMessagesChange = (index, value) => {
    const updatedHourPlan = [...localHourPlan];
    updatedHourPlan[index].message = value;
    setLocalHourPlan(updatedHourPlan);
  };

  const calculateP2 = (index, P1) => {
    const coefficient = localHourPlan[index]?.coefficient || 0;
    const volume = localHourPlan[index]?.volume || 0;
    const P2 = P1 * coefficient + volume;
    return P2 < 0 ? "П2 отрицательное" : P2.toFixed(2);
  };

  const calculateP2Gen = (index, P1Gen) => {
    const coefficient = localHourPlan[index]?.coefficient || 0;
    const volume = localHourPlan[index]?.volume || 0;
    const P2Gen = P1Gen * coefficient + volume;
    return P2Gen < 0 ? "П2_Gen отрицательное" : P2Gen.toFixed(2);
  };

  const handleCoefficientChange = (index, value) => {
    const updatedHourPlan = [...localHourPlan];
    updatedHourPlan[index].coefficient = parseFloat(value) || 0;
    setLocalHourPlan(updatedHourPlan);
  };

  const handleVolumeChange = (index, value) => {
    const updatedHourPlan = [...localHourPlan];
    updatedHourPlan[index].volume = parseInt(value, 10) || 0;
    setLocalHourPlan(updatedHourPlan);
  };

  const handleDisapprove = () => {
    setShowMessageCol(true);
    setShowButtons(false);
  };

  const handleCancel = () => {
    setShowMessageCol(false);
    setShowButtons(true);
  };

  const handleApprove = async () => {
    try {
      const acceptResponse = await axiosInstance.post(endpoints.ACCEPT_PLAN(dayPlan?.id));
      if (acceptResponse.status === 201) {
        console.log('План успешно утвержден:', acceptResponse.data);

        const calculateP2Response = await axiosInstance.post(endpoints.CALCULATE_P2, {
          subject: selectedSubject.id,
          date: selectedDate,
          volume: localHourPlan.map(hour => hour.volume || 0),
          coefficient: localHourPlan.map(hour => hour.coefficient || 0),
          plan: "P2"
        });

        if (calculateP2Response.status === 200) {
          console.log('Значения П2 успешно рассчитаны:', calculateP2Response.data);
          setWarningMessage('План утвержден и значения П2 успешно рассчитаны.');
        }
      }
    } catch (error) {
      console.error('Ошибка при утверждении плана или расчете П2:', error);
      setWarningMessage('Произошла ошибка при утверждении плана или расчете П2.');
    }
  };

  const handleSave = async () => {
    try {
      const coefficients = localHourPlan.map(hour => hour.coefficient);
      const volumes = localHourPlan.map(hour => hour.volume);

      const response = await axiosInstance.post(endpoints.PLANS_CREATE(dayPlan?.id), {
        plan: {
          coefficient: coefficients,
          // volume: volumes,
        }
      });

      const response_2 = await axiosInstance.post(endpoints.PLANS_CREATE(dayPlan?.id), {
        plan: {
          // coefficient: coefficients,
          volume: volumes,
        }
      });

      if (response.status === 201 && response_2.status === 201) {
        setWarningMessage('Данные успешно сохранены.');
      } else {
        setWarningMessage('Ошибка при сохранении данных.');
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      setWarningMessage('Ошибка при сохранении данных.');
    }
  };

  const handleImportFromFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        parseExcelData(jsonData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const parseExcelData = (rows) => {
    const updatedHourPlan = [...localHourPlan];
    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header row
      const [hourStr, coefficientStr, volumeStr] = row;
      const hour = parseInt(hourStr, 10);
      const coefficient = parseFloat(coefficientStr);
      const volume = parseInt(volumeStr, 10);
      const idx = hour - 1; // Assuming hours are from 1 to 24
      if (idx >= 0 && idx < 24) {
        updatedHourPlan[idx].coefficient = coefficient;
        updatedHourPlan[idx].volume = volume;
      }
    });
    setLocalHourPlan(updatedHourPlan);
  };

  const handleExport = () => {
    const exportData = [
      ['Hour', 'Coefficient', 'Volume'],
      ...localHourPlan.map(hourData => [hourData.hour, hourData.coefficient, hourData.volume, hourData.P2_message])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Coefficients_Volumes');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coefficients_volumes_${selectedSubject.subject_name}_${selectedDate}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {warningMessage && (
        <div className="mb-4 p-2 bg-yellow-200 text-yellow-800 rounded">
          {warningMessage}
        </div>
      )}
      {/* Existing Status Table */}
      <div className="overflow-x-auto max-w-[800px]">
        <table className="w-1/2 text-sm text-center rtl:text-right text-gray-500 dark:text-gray-40 mb-3">
          <thead className="text-xs text-gray-700 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2">{'Субъект'}</th>
              {subjectsList.map((subject) => (
                <th key={subject.id} className="px-4 py-2">{subject.subject_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2" scope="row">Статус</td>
              {subjectsList.map((subject) => (
                <td
                  key={subject.id}
                  className={`border px-4 py-2 hover:bg-blue-100 cursor-pointer ${selectedData.selectedSubject === subject.id ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => setSelectedData({
                    ...selectedData,
                    selectedSubject: subject.id
                  })}
                >
                  {loadingStatuses ? (
                    "Загрузка..."
                  ) : statusError ? (
                    statusError
                  ) : (
                    statusDisplayMap[statusMap[subject.id]] || "Нет данных"
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>


      {/* Import and Export Buttons */}
      <div className="flex justify-end space-x-2 my-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          onClick={handleImportFromFile}
        >
          Импорт из файла
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          onClick={handleExport}
        >
          Экспорт
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Existing Table */}
      <table className="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-40 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="w-[50px]"></th>
            <th className="w-[100px]">П1</th>
            {selectedSubject?.subject_type === "ЭПО" && <th className="w-[100px]">ГП1</th>}
            <th className="w-[100px]">Коэффициент</th>
            <th className="w-[100px]">Объем</th>
            <th className="w-[100px]">П2</th>
            <th className="w-[100px]">Сообщение П2</th>
            {selectedSubject?.subject_type === "ЭПО" && <th className="w-[100px]">ГП2</th>}
            {showMessageCol && <th className="w-[150px]">Сообщение</th>}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => {
            const P1 = localHourPlan[index]?.P1 || 0;
            const P1_Gen = localHourPlan[index]?.P1_Gen || 0;
            const P2 = calculateP2(index, P1);
            const P2Gen = selectedSubject?.subject_type === "ЭПО" ? calculateP2Gen(index, P1_Gen) : null;

            return (
              <tr key={time}>
                <td className={`border`}>{time}</td>
                <td className={`border`}>{P1}</td>
                {selectedSubject?.subject_type === "ЭПО" && <td className={`border`}>{P1_Gen}</td>}
                <td className={`border`}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={localHourPlan[index]?.coefficient || 0}
                    onChange={(e) => handleCoefficientChange(index, e.target.value)}
                    className="w-full text-center rounded"
                  />
                </td>
                <td className={`border`}>
                  <input
                    type="number"
                    value={localHourPlan[index]?.volume || 0}
                    onChange={(e) => handleVolumeChange(index, e.target.value)}
                    className="w-full text-center rounded"
                  />
                </td>
                <td className={`border ${P2 < 0 ? 'bg-red-100' : ''}`}>
                  {P2}
                </td>
                <td className={`border ${localHourPlan[index]?.P2_message === "Успешно!" ? 'bg-green-100' : localHourPlan[index]?.P2_message === "Ошибка!" ? 'bg-red-100' : ''}`}>
                  {localHourPlan[index]?.P2_message || ''}
                </td>
                {selectedSubject?.subject_type === "ЭПО" && (
                  <td className={`border ${P2Gen < 0 ? 'bg-red-100' : ''}`}>
                    {P2Gen}
                  </td>
                )}
                {showMessageCol && (
                  <td className={`border`}>
                    <input
                      type="text"
                      value={localHourPlan[index]?.message || ""}
                      onChange={(e) => handleMessagesChange(index, e.target.value)}
                      className="w-full text-center rounded"
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Save Button */}
      <div className="flex justify-end space-x-2 mt-4">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          onClick={handleSave}
        >
          Сохранить
        </button>
      </div>

      {showButtons && (
        <div className="flex justify-end space-x-2 mt-4">
          {dayPlan?.is_verified !== "ACCEPTED" ? (
            <>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                onClick={handleApprove}
              >
                Утвердить
              </button>
              {/* <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                onClick={handleDisapprove}
              >
                Отклонить
              </button> */}
            </>
          ) : (
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              onClick={handleApprove}
            >
              Утвердить
            </button>
          )}
        </div>
      )}

      {showMessageCol && (
        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={() => setWarningMessage('Сообщение отправлено!')}
          >
            Отправить
          </button>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
            onClick={handleCancel}
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
};

export default SubjectTable;

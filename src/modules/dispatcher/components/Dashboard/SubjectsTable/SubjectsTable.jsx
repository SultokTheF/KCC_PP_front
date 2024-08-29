import { useState, useEffect } from "react";

const timeIntervals = [
  '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
  '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
  '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
  '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00'
];

const SubjectTable = ({ selectedData, setSelectedData, subjectsList, daysList, hoursList, selectedDate }) => {
  const selectedSubject = subjectsList.find(subject => subject.id === selectedData.selectedSubject);
  const dayPlan = daysList?.find(day => day.subject === selectedSubject?.id && day.date.split('T')[0] === selectedDate.split('T')[0]) || null;
  const hourPlan = dayPlan ? hoursList.filter(hour => hour.day === dayPlan?.id) : [];

  const [coefficients, setCoefficients] = useState([]);
  const [volumes, setVolumes] = useState([]);
  const [showMessageCol, setShowMessageCol] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showButtons, setShowButtons] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');

  const getStatus = (subject) => {
    const day = daysList?.find(day => day.subject === subject.id && day.date.split('T')[0] === selectedDate.split('T')[0]);

    if (day?.status === "PRIMARY_PLAN") {
      return "-П1-";
    } else if (day?.status === "KCCPP_PLAN") {
      return "-П1-П2-";
    } else if (day?.status === "KEGOS_PLAN") {
      return "-П1-П2-П3-";
    } else if (day?.status === "FACT1") {
      return "-П1-П2-П3-Ф-";
    } else if (day?.status === "FACT2") {
      return "-П1-П2-П3-Ф-";
    } else if (day?.status === "COMPLETED") {
      return "-П1-П2-П3-Ф-";
    }

    return "-";
  };

  useEffect(() => {
    if (subjectsList.length > 0 && !selectedData.selectedSubject) {
      setSelectedData((prevData) => ({
        ...prevData,
        selectedSubject: subjectsList[0].id
      }));
    }
  }, [subjectsList, selectedData, setSelectedData]);

  useEffect(() => {
    if (selectedSubject) {
      setCoefficients(selectedSubject.coefficient?.[0] || []);
      setVolumes(selectedSubject.volume?.[0] || []);
      setMessages(hourPlan.map(hour => hour.message || ""));
    }
  }, [selectedSubject]);

  const handleCoefficientChange = (index, value) => {
    const updatedCoefficients = [...coefficients];
    updatedCoefficients[index] = parseFloat(value) || 0;
    setCoefficients(updatedCoefficients);
  };

  const handleVolumeChange = (index, value) => {
    const updatedVolumes = [...volumes];
    updatedVolumes[index] = parseInt(value) || 0;
    setVolumes(updatedVolumes);
  };

  const handleMessagesChange = (index, value) => {
    const updatedMessages = [...messages];
    updatedMessages[index] = value;
    setMessages(updatedMessages);
  };

  const calculateP2 = (index, P1) => {
    const P2 = P1 * (coefficients[index] || 0) + (volumes[index] || 0);
    return P2 < 0 ? "П2 отрицательное" : P2;
  };

  const calculateP2Gen = (index, P1Gen) => {
    const P2Gen = P1Gen * (coefficients[index] || 0) + (volumes[index] || 0);
    return P2Gen < 0 ? "П2_Gen отрицательное" : P2Gen;
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
          coefficient: [coefficients],
          volume: [volumes],
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

  return (
    <div>
      {warningMessage && (
        <div className="mb-4 p-2 bg-yellow-200 text-yellow-800 rounded">
          {warningMessage}
        </div>
      )}

      <table className="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-40 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th>{'Субъект'}</th>
            {subjectsList.map((subject) => (
              <th key={subject.id}>{subject.subject_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border w-1/12" scope="row">Статус</td>
            {subjectsList.map((subject) => (
              <td
                key={subject.id}
                className={`border hover:bg-blue-100 cursor-pointer ${selectedData.selectedSubject === subject.id ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setSelectedData({
                  ...selectedData,
                  selectedSubject: subject.id
                })}
              >
                {getStatus(subject)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <table className="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-40 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="w-[50px]"></th>
            <th className="w-[100px]">П1</th>
            {selectedSubject?.subject_type === "ЭПО" && <th className="w-[100px]">ГП1</th>}
            <th className="w-[100px]">Коэффициент</th>
            <th className="w-[100px]">Объем</th>
            <th className="w-[100px]">П2</th>
            {selectedSubject?.subject_type === "ЭПО" && <th className="w-[100px]">ГП2</th>}
            {showMessageCol && <th className="w-[150px]">Сообщение</th>}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              <td className={`border`}>{time}</td>
              <td className={`border`}>{hourPlan[index]?.P1 || "-"}</td>
              {selectedSubject?.subject_type === "ЭПО" && <td className={`border`}>{hourPlan[index]?.P1_Gen || "-"}</td>}
              <td className={`border`}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={coefficients[index] || 0}
                  onChange={(e) => handleCoefficientChange(index, e.target.value)}
                  className="w-full text-center rounded"
                />
              </td>
              <td className={`border`}>
                <input
                  type="number"
                  value={volumes[index] || 0}
                  onChange={(e) => handleVolumeChange(index, e.target.value)}
                  className="w-full text-center rounded"
                />
              </td>
              <td className={`border`}>
                {calculateP2(index, hourPlan[index]?.P1 || 0)}
              </td>
              {selectedSubject?.subject_type === "ЭПО" && (
                <td className={`border`}>
                  {calculateP2Gen(index, hourPlan[index]?.P1_Gen || 0)}
                </td>
              )}
              {showMessageCol && (
                <td className={`border`}>
                  <input
                    type="text"
                    value={messages[index] || ""}
                    onChange={(e) => handleMessagesChange(index, e.target.value)}
                    className="w-full text-center rounded"
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

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
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                onClick={handleDisapprove}
              >
                Отклонить
              </button>
            </>
          ) : (
            <p className="text-gray-600">День уже утвержден</p>
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
}

export default SubjectTable;

import { useEffect } from "react"

const timeIntervals = [
  '00 - 01',
  '01 - 02',
  '02 - 03',
  '03 - 04',
  '04 - 05',
  '05 - 06',
  '06 - 07',
  '07 - 08',
  '08 - 09',
  '09 - 10',
  '10 - 11',
  '11 - 12',
  '12 - 13',
  '13 - 14',
  '14 - 15',
  '15 - 16',
  '16 - 17',
  '17 - 18',
  '18 - 19',
  '19 - 20',
  '20 - 21',
  '21 - 22',
  '22 - 23',
  '23 - 00'
]

const SubjectTable = ({ selectedData, setSelectedData, subjectsList, daysList, hoursList, selectedDate }) => {
  const selectedSubject = subjectsList.find(subject => subject.id === selectedData.selectedSubject)
  const dayPlan = daysList.find(day => day.subject === selectedSubject?.id && day.date.split('T')[0] === selectedDate.split('T')[0])
  const hourPlan = hoursList.filter(hour => hour.day === dayPlan?.id)

  const getStatus = (subject) => {
    const day = daysList.find(day => day.subject === subject && day.date.split('T')[0] === selectedDate.split('T')[0])

    if (day?.status === "PRIMARY_PLAN") {
      return "-П1-"
    } else if (day?.status === "KCCPP_PLAN") {
      return "-П1-П2-"
    } else if (day?.status === "KEGOS_PLAN") {
      return "-П1-П2-П3-"
    } else if (day?.status === "FACT1") {
      return "-П1-П2-П3-Ф-"
    } else if (day?.status === "FACT2") {
      return "-П1-П2-П3-Ф-"
    } else if (day?.status === "COMPLETED") {
      return "-П1-П2-П3-Ф-"
    }

    return "-";
  }

  useEffect(() => {
    setSelectedData({
      ...selectedData,
      selectedSubject: subjectsList[0]?.id || 0
    })
  }, [subjectsList])

  return (
    <>
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
                {getStatus(subject.id)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <table className="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-40 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="w-[100px]"></th>
            <th className="w-[100px]">П1</th>
            {selectedSubject?.subject_type === "ЭПО" && <th className="w-[100px]">ГП1</th>}
            <th className="w-[100px]">П2</th>
            {selectedSubject?.subject_type === "ЭПО" && <th className="w-[100px]">ГП2</th>}
            <th className="w-[100px]">П3</th>
            {selectedSubject?.subject_type === "ЭПО" && <th className="w-[100px]">ГП3</th>}
            <th className="w-[100px]">Ф</th>
            {selectedSubject?.subject_type === "ЭПО" && <th className="w-[100px]">ГФ</th>}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              <td className={`border`}>{time}</td>
              <td className={`border`}>{hourPlan[index]?.P1 || "-"}</td>
              {selectedSubject?.subject_type === "ЭПО" && <td className={`border`}>{hourPlan[index]?.P1_Gen || "-"}</td>}
              <td className={`border`}>{hourPlan[index]?.P2 || "-"}</td>
              {selectedSubject?.subject_type === "ЭПО" && <td className={`border`}>{hourPlan[index]?.P2_Gen || "-"}</td>}
              <td className={`border`}>{hourPlan[index]?.P3 || "-"}</td>
              {selectedSubject?.subject_type === "ЭПО" && <td className={`border`}>{hourPlan[index]?.P3_Gen || "-"}</td>}
              <td className={`border`}>{hourPlan[index]?.F1 || "-"}</td>
              {selectedSubject?.subject_type === "ЭПО" && <td className={`border`}>{hourPlan[index]?.F1_Gen || "-"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default SubjectTable;

import React from "react";

const ReportTariffsTable = ({ data, selectedHour }) => {
  const formatSubjectName = (sub_id) => {
    const subjects = data.subjects.find((subject) => subject.id === sub_id);
    return subjects ? subjects.subject_name : "";
  }

  const formatSubjectType = (sub_id) => {
    const subjects = data.subjects.find((subject) => subject.id === sub_id);

    if (subjects.subject_type === "ЭПО") return "Станция"
    if (subjects.subject_type === "CONSUMER") return "Потребитель"

    return subjects ? subjects.subject_type : "";
  }

  return (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <table className="min-w-full bg-white text-center table-auto border-collapse">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3 text-sm font-semibold text-gray-700">Имя Субъекта</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тип Субъекта</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Час</th>
            <th className="p-3 text-sm font-semibold text-gray-700">П1</th>
            <th className="p-3 text-sm font-semibold text-gray-700">П2</th>
            <th className="p-3 text-sm font-semibold text-gray-700">П3</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Ф1</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Ф2</th>
            <th className="p-3 text-sm font-semibold text-gray-700">П1 План Ген.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">П2 План Ген.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">П3 План Ген.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Ф1 План Ген.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Ф2 План Ген.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE up</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE down</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD up</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD down</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE up V1</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE down V1</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD up V1</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD down V1</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE up V2</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE down V2</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD up V2</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD down V2</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE up V3</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE down V3</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD up V3</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD down V3</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE up V4</th>
            <th className="p-3 text-sm font-semibold text-gray-700">BE down V4</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD up V4</th>
            <th className="p-3 text-sm font-semibold text-gray-700">OD down V4</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф ЕЗ</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Базовый ЕЗ</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф Пров. Инд.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф БЭ</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф ОД</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф Инд.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф Пров.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Инд Тариф V1</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Пров. Тариф V1</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Инд Тариф V2</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Пров. Тариф V2</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Инд Тариф V3</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Пров. Тариф V3</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Инд Тариф V4</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Пров. Тариф V4</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Направление</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Сообщение</th>
          </tr>
        </thead>
        <tbody>
          {parseInt(data.subject) === 0
            ? data.hours
                .filter((hour) =>
                  hour.hours.some((h) => h.hour === parseInt(selectedHour))
                )
                .flatMap((subjectData) =>
                  subjectData.hours
                    .filter((hour) => hour.hour === parseInt(selectedHour))
                    .map((hourData) => (
                      <tr
                        key={hourData.id}
                        className="bg-white border-b hover:bg-gray-100 transition duration-200"
                      >
                        <td className="p-3 text-sm text-gray-700">
                          {formatSubjectName(subjectData.subject)}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {formatSubjectType(subjectData.subject)}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.hour}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.P1}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.P2}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.P3}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.F1}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.F2}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.P1_Gen}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.P2_Gen}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.P3_Gen}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.F1_Gen}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.F2_Gen}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Up}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Down}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Up}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Down}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Up_V1}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Down_V1}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Up_V1}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Down_V1}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Up_V2}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Down_V2}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Up_V2}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Down_V2}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Up_V3}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Down_V3}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Up_V3}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Down_V3}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Up_V4}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_Down_V4}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Up_V4}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_Down_V4}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.EZ_T}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.EZ_Base_T}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Ind_Prov_T}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.BE_T}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.OD_T}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Ind_T}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Prov_T}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Ind_T_V1}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Prov_T_V1}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Ind_T_V2}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Prov_T_V2}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Ind_T_V3}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Prov_T_V3}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Ind_T_V4}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.Prov_T_V4}
                        </td>
                        <td
                          className={`p-3 text-sm text-gray-700 ${
                            hourData.direction === "DOWN"
                              ? "bg-green-100"
                              : hourData.direction === "UP"
                              ? "bg-red-100"
                              : ""
                          }`}
                        >
                          {hourData.direction === "UP"
                            ? "↑"
                            : hourData.direction === "DOWN"
                            ? "↓"
                            : hourData.direction}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {hourData.message}
                        </td>
                      </tr>
                    ))
                )
            : data.hours
                .find((subjectData) => subjectData.subject === parseInt(data.subject))
                ?.hours.map((hourData) => (
                  <tr
                    key={hourData.id}
                    className="bg-white border-b hover:bg-gray-100 transition duration-200"
                  >
                    <td className="p-3 text-sm text-gray-700">{formatSubjectName(parseInt(data.subject))}</td>
                    <td className="p-3 text-sm text-gray-700">{formatSubjectType(parseInt(data.subject))}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.hour}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.P1}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.P2}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.P3}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.F1}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.F2}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.P1_Gen}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.P2_Gen}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.P3_Gen}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.F1_Gen}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.F2_Gen}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Up}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Down}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Up}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Down}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Up_V1}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Down_V1}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Up_V1}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Down_V1}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Up_V2}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Down_V2}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Up_V2}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Down_V2}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Up_V3}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Down_V3}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Up_V3}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Down_V3}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Up_V4}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_Down_V4}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Up_V4}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_Down_V4}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.EZ_T}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.EZ_Base_T}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Ind_Prov_T}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.BE_T}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.OD_T}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Ind_T}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Prov_T}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Ind_T_V1}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Prov_T_V1}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Ind_T_V2}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Prov_T_V2}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Ind_T_V3}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Prov_T_V3}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Ind_T_V4}</td>
                    <td className="p-3 text-sm text-gray-700">{hourData.Prov_T_V4}</td>
                    <td
                      className={`p-3 text-sm text-gray-700 ${
                        hourData.direction === "DOWN"
                          ? "bg-green-100"
                          : hourData.direction === "UP"
                          ? "bg-red-100"
                          : ""
                      }`}
                    >
                      {hourData.direction === "UP"
                        ? "↑"
                        : hourData.direction === "DOWN"
                        ? "↓"
                        : hourData.direction}
                    </td>
                    <td className="p-3 text-sm text-gray-700">{hourData.message}</td>
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTariffsTable;

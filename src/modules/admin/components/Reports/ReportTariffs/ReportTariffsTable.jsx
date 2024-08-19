import React from "react";

const ReportTariffsTable = ({ data, selectedHour }) => {
  const formatDirection = (direction) => {
    if (direction === "UP") return "↑";
    if (direction === "DOWN") return "↓";
    return direction;
  };

  // Helper function to render table rows for a single hour object
  const renderTableRow = (hourData) => {
    return (
      <tr key={hourData.id} className="bg-white border-b hover:bg-gray-100 transition duration-200">
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
        <td className="p-3 text-sm text-gray-700">{hourData.EZ_T}</td>
        <td className="p-3 text-sm text-gray-700">{hourData.EZ_Base_T}</td>
        <td className="p-3 text-sm text-gray-700">{hourData.Ind_Prov_T}</td>
        <td className="p-3 text-sm text-gray-700">{hourData.BE_T}</td>
        <td className="p-3 text-sm text-gray-700">{hourData.OD_T}</td>
        <td className="p-3 text-sm text-gray-700">{hourData.Ind_T}</td>
        <td className="p-3 text-sm text-gray-700">{hourData.Prov_T}</td>
        <td className={`p-3 text-sm text-gray-700 ${hourData.direction === "DOWN" ? "bg-green-100" : hourData.direction === "UP" ? "bg-red-100" : ""}`}>{formatDirection(hourData.direction)}</td>
      </tr>
    );
  };

  const renderTable = (hoursData) => (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <table className="min-w-full bg-white text-center table-auto border-collapse">
        <thead className="bg-gray-200">
          <tr>
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
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф ЕЗ</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Базовый ЕЗ</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф Пров. Инд.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф БЭ</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф ОД</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф Инд.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Тариф Пров.</th>
            <th className="p-3 text-sm font-semibold text-gray-700">Направление</th>
          </tr>
        </thead>
        <tbody>
          {hoursData.map(renderTableRow)}
        </tbody>
      </table>
    </div>
  );

  // Conditional rendering based on selected subject
  if (parseInt(data.subject) === 0) {
    // Show data for the selected hour across all subjects
    const filteredHours = data.hours.filter(hour =>
      hour.hours.some(h => h.hour === parseInt(selectedHour))
    );
    return renderTable(filteredHours.flatMap(subjectData =>
      subjectData.hours.filter(hour => hour.hour === parseInt(selectedHour))
    ));
  } else {
    // Show all 24 hours for the selected subject
    const subjectHours = data.hours.find(subjectData =>
      subjectData.subject === parseInt(data.subject)
    );
    return subjectHours ? renderTable(subjectHours.hours) : <p>No data available</p>;
  }
};

export default ReportTariffsTable;

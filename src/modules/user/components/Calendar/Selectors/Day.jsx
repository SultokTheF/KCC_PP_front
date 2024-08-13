const Day = ({ date, setDate, holidays }) => {
  const daysInMonth = Array.from({ length: new Date(date.year, date.month, 0).getDate() }, (_, index) => index + 1);

  const getDayOfWeek = (day) => {
    const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const newDate = new Date(`${date.year}-${date.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
    return days[newDate.getDay()];
  }

  const getHolidayStyle = (day) => {
    const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holidaysForDay = holidays.filter(holiday => holiday.date === formattedDate);
    const kazakhstanHolidays = holidaysForDay.filter(holiday => holiday.country === "Kazakhstan");
    const russiaHolidays = holidaysForDay.filter(holiday => holiday.country === "Russia");
    const weekendHolidays = holidaysForDay.filter(holiday => holiday.country === "WEEKEND");
    const newDate = `${date.year}-${date.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const selectedDay = date.selectedDate;
    if (selectedDay === newDate) {
      return "bg-blue-500 text-white"
    } else if (kazakhstanHolidays.length > 0 && russiaHolidays.length > 0) {
      return "bg-gradient-to-r from-green-100 to-red-100";
    } else if (kazakhstanHolidays.length > 0) {
      return "bg-green-100";
    } else if (russiaHolidays.length > 0) {
      return "bg-red-100";
    } else if (weekendHolidays.length > 0) {
      return "bg-yellow-100";
    }
    
    return "";
  };

  return (
    <div className="relative overflow-x-auto bg-white rounded-b-lg shadow-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-200">
          <tr>
            {daysInMonth.map((day, index) => (
              <th scope="col" className="text-center border w-10 p-2" key={index}>
                {getDayOfWeek(day)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-white">
            {daysInMonth.map((day, index) => (
              <td
                scope="col"
                className={`
                  text-center 
                  border 
                  w-10 
                  p-2 
                  cursor-pointer 
                  hover:bg-blue-100 
                  ${day ? getHolidayStyle(day) : ""}
                `}
                key={index}
                onClick={() =>
                  setDate((prevData) => ({
                    ...prevData,
                    day: day
                  }))
                }
              >
                {day}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Day;

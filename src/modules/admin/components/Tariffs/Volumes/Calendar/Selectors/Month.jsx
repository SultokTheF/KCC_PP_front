const Month = ({ date, setDate }) => {
  const months = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь"
  ];

  const isSelectedMonth = (index) => {
    return date.month === index ? "bg-blue-500 text-white" : "";
  }

  return (
    <div className="relative overflow-x-auto bg-white rounded-b-lg shadow-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <tbody>
          <tr className="bg-white">
            {months.map((month, index) => (
              <td 
                scope="col" 
                className={`text-center border w-10 p-2  hover:bg-blue-100 ${isSelectedMonth(index)}`}
                key={index}
                onClick={() =>
                  setDate((prevData) => ({
                    ...prevData,
                    month: index
                  }))
                }
              >
                {month}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default Month;
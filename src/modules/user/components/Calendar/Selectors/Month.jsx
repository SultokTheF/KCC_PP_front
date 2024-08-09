const Month = ({ date, setDate }) => {
  const monthNames = {
    "01": "Январь",
    "02": "Февраль",
    "03": "Март",
    "04": "Апрель",
    "05": "Май",
    "06": "Июнь",
    "07": "Июль",
    "08": "Август",
    "09": "Сентябрь",
    "10": "Октябрь",
    "11": "Ноябрь",
    "12": "Декабрь",
  };

  return (
    <>
      <select
        id="month"
        value={date.month}
        onChange={(e) =>
          setDate((prevData) => ({
            ...prevData,
            month: e.target.value,
          }))
        }
        className="text-center border rounded px-3 py-2 bg-white shadow"
      >
        {Object.keys(monthNames).map((key) => (
          <option key={key} value={key}>
            {monthNames[key]}
          </option>
        ))}
      </select>
    </>
  );
};

export default Month;

const Year = ({ date, setDate }) => {
  return (
    <>
      <select
        id="year"
        value={date.year}
        onChange={(e) => {
          setDate((prevData) => ({
            ...prevData,
            year: parseInt(e.target.value)
          }))
        }}
        className="text-center border rounded-lg px-4 py-2 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {Array.from({ length: 10 }, (_, index) => (
          <option key={index} value={date.year - 5 + index}>
            {date.year - 5 + index}
          </option>
        ))}
      </select>
    </>
  );
}

export default Year;

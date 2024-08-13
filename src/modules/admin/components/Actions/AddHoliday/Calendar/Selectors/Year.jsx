const Year = ({ date, setDate }) => {
  return (
    <>
      <select
        id="year"
        value={date.year}
        onChange={(e) => {
          setDate((prevData) => ({
            ...prevData,
            year: e.target.value
          }))
        }}
        className="text-center border rounded mx-3 px-5 py-2 bg-white shadow"
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

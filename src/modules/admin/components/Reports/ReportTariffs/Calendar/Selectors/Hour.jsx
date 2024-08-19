const Hour = ({ data, setData }) => {
  return (
    <>
      <select 
        name="hour" 
        id="hour"
        value={data.hour}
        onChange={(e) => setData((prevData) => ({ ...prevData, hour: e.target.value }))}
        className="text-center border rounded px-3 py-2 bg-white shadow"
      >
        {Array.from({ length: 24 }, (_, index) => (
          <option key={index} value={index + 1}>
            {index + 1}
          </option>
        ))}
      </select>
    </>
  );
}

export default Hour;
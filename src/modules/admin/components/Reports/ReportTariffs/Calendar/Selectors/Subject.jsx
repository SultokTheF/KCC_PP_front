const Subject = ({ data, setData }) => {
  const handleChange = (event) => {
    setData((prevData) => ({
      ...prevData,
      subject: event.target.value,
    }));
  }

  return (
    <select
      className="text-center border rounded mr-3 px-5 py-2 bg-white shadow"
      value={data.subject}
      onChange={handleChange}
    >
      <option value={0}>Все субъекты</option>
      {data.subjects.map((subject) => (
        <option key={subject.id} value={subject.id}>{subject.subject_name}</option>
      ))}
    </select>
  );
}

export default Subject;
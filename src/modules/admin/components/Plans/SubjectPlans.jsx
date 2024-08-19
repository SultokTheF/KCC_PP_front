import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../../../../services/apiConfig";
import Sidebar from "../Sidebar/Sidebar";
import 'tailwindcss/tailwind.css';

const SubjectPlans = () => {
  const { subjectId } = useParams();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [plan, setPlan] = useState("P1");
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (!subjectId) {
      alert("No subject ID found in URL");
    }
  }, [subjectId]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('plan', plan);
    formData.append('date_period', String(startDate) + ' to ' + String(endDate));
    formData.append('object_id', subjectId);

    try {
      const response = await axiosInstance.post('/api/import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        alert("Data imported successfully");
        setTableData(response.data.table_data);  // Assuming your backend returns the table data
      } else {
        alert("Failed to import data");
      }
    } catch (error) {
      console.error("Error importing data:", error);
      alert("Error importing data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange} 
            className="mb-4 p-2 border rounded" 
          />
          <input 
            type="date"
            value={startDate}  
            onChange={(e) => setStartDate(e.target.value)} 
            className="mb-4 p-2 mx-2 border rounded" 
          />
          <input 
            type="date"
            value={endDate}  
            onChange={(e) => setEndDate(e.target.value)} 
            className="mb-4 p-2 mx-2 border rounded" 
          />
          <select name="plan" id="plan" value={plan} onChange={e => setPlan(e.target.value)} className="mb-4 p-2 mx-2 border rounded">
            <option value="P1">P1</option>
            <option value="P1_Gen">P1_Gen</option>
            <option value="P2">P2</option>
            <option value="P2_Gen">P2_Gen</option>
            <option value="P3">P3</option>
            <option value="P3_Gen">P3_Gen</option>
            <option value="F1">F1</option>
            <option value="F1_Gen">F1_Gen</option>
            <option value="F2">F2</option>
            <option value="F2_Gen">F2_Gen</option>
          </select>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <button 
              onClick={handleImport} 
              className="mb-4 p-2 bg-blue-500 text-white rounded"
            >
              Импортировать
            </button>
          )}
          {tableData.length > 0 && (
            <div>
              {tableData.map((day, index) => (
                <div key={index} className="mb-8">
                  <h2 className="text-lg font-bold mb-2">{day.date}</h2>
                  <table className="min-w-full bg-white border text-center border-gray-300 rounded shadow">
                    <thead>
                      <tr>
                        {Object.keys(day.hours[0]).map((header, index) => (
                          <th key={index} className="py-2 px-4 border-b">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {day.hours.map((hour, rowIndex) => (
                        <tr key={rowIndex} className="border-t">
                          {Object.values(hour).map((cell, cellIndex) => (
                            <td key={cellIndex} className="py-2 px-4 border-b">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubjectPlans;

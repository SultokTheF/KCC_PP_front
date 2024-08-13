import React, { useState } from "react";
import Year from "./Selectors/Year";
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ArrowUpOnSquareIcon
} from "@heroicons/react/24/solid";

import { axiosInstance, endpoints } from "../../../../../../services/apiConfig";

const Navbar = ({ date, setDate, data, setData }) => {
  const [loading, setLoading] = useState({ export: false, import: false, upload: false });

  const uploadTableData = () => {
    setLoading(prev => ({ ...prev, upload: true }));
    console.log('Загрузка данных...');
    const payload = {
      month: `${date.year}-${String(date.month + 1).padStart(2, '0')}`,
      data: data.tableData,
      subject_id: data.subject,
    };

    axiosInstance.post(endpoints.INDPROV_CREATE, payload)
      .then(response => {
        console.log('Данные успешно загружены', response.data);
      })
      .catch(error => {
        console.error('Ошибка при загрузке данных', error);
      })
      .finally(() => {
        setLoading(prev => ({ ...prev, upload: false }));
      });
  };

  const exportToCSV = () => {
    setLoading(prev => ({ ...prev, export: true }));
    console.log('Экспорт данных...');

    const headers = ["Дата", ...Array.from({ length: 24 }, (_, i) => `Час ${i + 1}`)];
    const rows = data.tableData.map(dayData => {
      const day = Object.keys(dayData)[0];
      const row = [day.split('-').reverse().join('.')]; // Date in format dd.mm.yyyy
      row.push(...dayData[day]);
      return row;
    });

    const csvContent = [
      headers.join(","), 
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const fileName = `Фактическе_тариффы_${data.tariffType}_${date.year}-${String(date.month + 1).padStart(2, '0')}.csv`;

    if (navigator.msSaveBlob) { // For IE 10+
      navigator.msSaveBlob(blob, fileName);
    } else {
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    console.log('Экспорт завершен');
    setLoading(prev => ({ ...prev, export: false }));
  };

  const importFromCSV = (event) => {
    setLoading(prev => ({ ...prev, import: true }));
    console.log('Импорт данных...');
  
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(","); // Get headers to check structure
  
      const newTableData = lines.slice(1).map(line => {
        const [day, ...hours] = line.split(",");
        const [dayNumber, monthNumber, yearNumber] = day.split('.').map(Number);
        const dayString = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        return { [dayString]: hours };
      });
  
      // Update table data
      setData(prevData => ({
        ...prevData,
        tableData: newTableData
      }));
  
      // Extract the year and month from the first date in the imported data
      if (newTableData.length > 0) {
        const firstDate = Object.keys(newTableData[0])[0];
        const [year, month] = firstDate.split('-').map(Number);
        
      }
  
      console.log('Импорт завершен');
    };
  
    reader.onerror = () => {
      console.error('Ошибка при импорте файла');
    };
  
    reader.onloadend = () => {
      setLoading(prev => ({ ...prev, import: false }));
    };
  
    reader.readAsText(file);
  };  

  return (
    <div className="flex w-full justify-between items-center px-6 py-4 bg-gray-100 border-b shadow">
      <span className="text-lg font-semibold text-gray-700">Предельные Тариффы</span>
      <div className="flex items-center ml-24 space-x-4">
        <Year date={date} setDate={setDate} />

        <select
          id="provider"
          value={data.provider}
          onChange={(e) => {
            setData((prevData) => ({
              ...prevData,
              provider: parseInt(e.target.value)
            }));
          }}
          className="text-center border rounded-lg px-4 py-2 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Провайдер</option>
          {data.providers.map((provider, index) => (
            <option key={index} value={parseInt(provider.id)}>
              {provider.name}
            </option>
          ))}
        </select>

        <select
          id="subject"
          value={data.subject}
          onChange={(e) => {
            setData((prevData) => ({
              ...prevData,
              subject: parseInt(e.target.value)
            }));
          }}
          className="text-center border rounded-lg px-4 py-2 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Субъект</option>
          {data.subjects.map((subject, index) => (
            <option key={index} value={parseInt(subject.id)}>
              {subject.subject_name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={exportToCSV} className="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none">
          {loading.export ? (
            <span>Экспорт...</span>
          ) : (
            <>
              <CloudArrowUpIcon className="h-5 w-5 mr-1" />
              Эспортировать
            </>
          )}
        </button>
        <input
          type="file"
          accept=".csv"
          onChange={importFromCSV}
          className="hidden"
          id="import-file"
        />
        <label htmlFor="import-file" className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer focus:outline-none">
          {loading.import ? (
            <span>Импорт...</span>
          ) : (
            <>
              <CloudArrowDownIcon className="h-5 w-5 mr-1" />
              Импортировать
            </>
          )}
        </label>
        <button onClick={uploadTableData} className="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none">
          {loading.upload ? (
            <span>Загрузка...</span>
          ) : (
            <>
              <ArrowUpOnSquareIcon className="h-5 w-5 mr-1" />
              Загрузить
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navbar;

import React, { useState } from "react";
import Year from "./Selectors/Year";
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ArrowUpOnSquareIcon
} from "@heroicons/react/24/solid";
import * as XLSX from 'xlsx';

import { axiosInstance, endpoints } from "../../../../../../services/apiConfig";

const Navbar = ({ date, setDate, data, setData }) => {
  const [loading, setLoading] = useState({ export: false, import: false, upload: false });

  const uploadTableData = () => {
    setLoading(prev => ({ ...prev, upload: true }));
    console.log('Загрузка данных...');
    const payload = {
      month: `${date.year}-${String(date.month + 1).padStart(2, '0')}`,
      data: data.tableData,
      tariff_type: data.tariffType,
    };

    axiosInstance.post(endpoints.CALCULATE_TARIFFS, payload)
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

  const exportToXLSX = () => {
    setLoading(prev => ({ ...prev, export: true }));
    console.log('Экспорт данных...');
  
    const headers = ["Дата", ...Array.from({ length: 24 }, (_, i) => `Час ${i + 1}`)];
    
    const getRandomValue = () => Math.floor(Math.random() * (50 - 10 + 1)) + 10;
  
    const rows = data.tableData.map(dayData => {
      const day = Object.keys(dayData)[0];
      const row = [day.split('-').reverse().join('.')]; // Date in format dd.mm.yyyy
      row.push(...dayData[day].map(hourValue => hourValue === 0 ? getRandomValue() : hourValue));
      // row.push(...dayData[day].map(hourValue => hourValue === 0 ? hourValue : hourValue));
      return row;
    });
  
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Предельные Тарифы");
  
    const fileName = `Предельные_тарифы_${data.subject_type}_${date.year}-${String(date.month + 1).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  
    console.log('Экспорт завершен');
    setLoading(prev => ({ ...prev, export: false }));
  };

  const importFromXLSX = (event) => {
    setLoading(prev => ({ ...prev, import: true }));
    console.log('Импорт данных...');
  
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
      // Get the first row date, assuming the date is in the first row and first column
      let firstDay = rows[1][0];  // Assuming that the first date is in the second row
      let month, year;
  
      // Handle both string and number dates
      if (typeof firstDay === 'string') {
        // Extract year and month from the date string (e.g., "2024-01-01")
        const firstDate = new Date(firstDay);
        month = firstDate.getMonth() + 2;  // Add 1 to move to the next month
        year = firstDate.getFullYear();
        if (month > 12) {
          month = 1; // Wrap to January if the month is December
          year += 1; // Increment the year
        }
      } else if (typeof firstDay === 'number') {
        // Handle Excel serial date format (numeric)
        const excelStartDate = new Date(1899, 11, 30);  // Excel's base date
        const firstDate = new Date(excelStartDate.getTime() + (firstDay - 1) * 24 * 60 * 60 * 1000);
        month = firstDate.getMonth() + 2;  // Add 1 to move to the next month
        year = firstDate.getFullYear();
        if (month > 12) {
          month = 1; // Wrap to January if the month is December
          year += 1; // Increment the year
        }
      }
  
      // Generate all dates for this next month
      const daysInMonth = new Date(year, month, 0).getDate();  // Get number of days in the month
      const dateArray = [];
  
      // Correct date generation for each day in the next month
      for (let day = 1; day <= daysInMonth; day++) {
        const formattedDay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dateArray.push(formattedDay);
      }
  
      // Now map the tariff data to the generated dates
      const newTableData = dateArray.map((date, index) => {
        const row = rows[index + 1];  // Skip the header row
  
        if (row) {
          // Extract the hourly data (assuming hours start from column 2)
          const hours = row.slice(1);
          return { [date]: hours };
        } else {
          return { [date]: new Array(24).fill(0) };  // If no data, fill with 0
        }
      });
  
      // Update table data
      setData(prevData => ({
        ...prevData,
        tableData: newTableData
      }));
  
      console.log('Импорт завершен');
    };
  
    reader.onerror = () => {
      console.error('Ошибка при импорте файла');
    };
  
    reader.onloadend = () => {
      setLoading(prev => ({ ...prev, import: false }));
    };
  
    reader.readAsArrayBuffer(file);
  };
  
  

  return (
    <div className="flex w-full justify-between items-center px-6 py-4 bg-gray-100 border-b shadow">
      <span className="text-lg font-semibold text-gray-700">Фактические Тарифы</span>
      <div className="flex items-center ml-24 space-x-4">
        <Year date={date} setDate={setDate} />

        <select 
          name="tariffType" 
          id="tariffType"
          value={data.tariffType}
          onChange={(e) => {
            setData((prevData) => ({
              ...prevData,
              tariffType: e.target.value
            }));
          }}
          className="text-center border rounded-lg px-4 py-2 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="EZ_T">Ez_T</option>
          <option value="EZ_Base_T">EZ_Base_T</option>
          <option value="EZ_T_ВИЭ">EZ_T_ВИЭ</option>
          <option value="OD_T">OD_T</option>
          <option value="BE_T">BE_T</option>
          <option value="EZ_T_РЭК">EZ_T_РЭК</option>
        </select>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={exportToXLSX} className="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none">
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
          accept=".xlsx"
          onChange={importFromXLSX}
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

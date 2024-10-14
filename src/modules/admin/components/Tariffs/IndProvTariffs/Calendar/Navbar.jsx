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

  const exportToXLSX = () => {
    setLoading(prev => ({ ...prev, export: true }));
    console.log('Экспорт данных...');

    const headers = ["Дата", ...Array.from({ length: 24 }, (_, i) => `Час ${i + 1}`)];

    const getRandomValue = () => Math.floor(Math.random() * (50 - 10 + 1)) + 10;

    const rows = data.tableData.map(dayData => {
      const day = Object.keys(dayData)[0];
      const row = [day.split('-').reverse().join('.')]; // Date in format dd.mm.yyyy
      // row.push(...dayData[day].map(hourValue => hourValue === 0 ? getRandomValue() : hourValue));
      row.push(...dayData[day].map(hourValue => hourValue === 0 ? hourValue : hourValue));
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

      const newTableData = rows.slice(1).map(row => {
        let [day, ...hours] = row;

        // If `day` is a number (Excel serialized date), convert it to a JS Date object
        if (typeof day === 'number') {
          const excelStartDate = new Date(1900, 0, 1); // Excel's start date
          day = new Date(excelStartDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
        }

        // Convert Date object to `YYYY-MM-DD` format
        if (day instanceof Date) {
          const dayNumber = String(day.getDate()).padStart(2, '0');
          const monthNumber = String(day.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
          const yearNumber = day.getFullYear();
          day = `${yearNumber}-${monthNumber}-${dayNumber}`;
        } else if (typeof day === 'string') {
          // If `day` is a string in `dd.mm.yyyy` format, convert it to `YYYY-MM-DD`
          if (day.includes('.')) {
            const [dayNumber, monthNumber, yearNumber] = day.split('.').map(Number);
            day = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
          }
          // If already in `YYYY-MM-DD`, no conversion needed
        } else {
          console.error('Не удалось обработать дату:', day);
          return null;
        }

        // Create an object for each day's data
        return { [day]: hours };
      }).filter(row => row !== null); // Filter out any rows that failed to process

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
      <span className="text-lg font-semibold text-gray-700">Предельные Тарифы</span>
      <div className="flex items-center ml-24 space-x-4">
        <select
          name="subject_type"
          id="subject_type"
          className="text-center border rounded-lg px-4 py-2 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={data.subject_type}
          onChange={(e) => {
            setData((prevData) => ({
              ...prevData,
              subject_type: e.target.value
            }));
          }}
        >
          <option value="ЭПО">ЭПО</option>
          <option value="ГП">ГП</option>
        </select>

        <Year date={date} setDate={setDate} />

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
          {data.subjects.filter(s => s.subject_type === data.subject_type).map((subject, index) => (
            <option key={index} value={parseInt(subject.id)}>
              {subject.subject_name}
            </option>
          ))}
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

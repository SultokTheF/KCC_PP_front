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
  const [loading, setLoading] = useState({ export: false, import: false, upload: false, superButton: false });

  const uploadTableData = () => {
    setLoading(prev => ({ ...prev, upload: true }));
    console.log('Загрузка данных...');
    const payload = {
      month: `${date.year}-${String(date.month + 1).padStart(2, '0')}`,
      data: data.tableData,
      subject_id: data.subject,
    };

    axiosInstance.post(endpoints.COEF_CREATE, payload)
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
      return row;
    });
  
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Объемные Тарифы");
  
    const fileName = `Объемные Тарифы_${data.subject_type}_${date.year}-${String(date.month + 1).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  
    console.log('Экспорт завершен');
    setLoading(prev => ({ ...prev, export: false }));
  };

  const handleSuperButtonClick = async () => {
    setLoading(prev => ({ ...prev, superButton: true }));
    try {
      const accessToken = localStorage.getItem('accessToken');
      await axiosInstance.post(
        '/api/days/superButton/',
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      alert('Супер кнопка нажата!');
    } catch (error) {
      console.error('Ошибка при выполнении запроса супер кнопки:', error);
    } finally {
      setLoading(prev => ({ ...prev, superButton: false }));
    }
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
  
        if (typeof day === 'number') {
          const excelStartDate = new Date(1900, 0, 1);
          day = new Date(excelStartDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
        }
  
        if (day instanceof Date) {
          const dayNumber = String(day.getDate()).padStart(2, '0');
          const monthNumber = String(day.getMonth() + 1).padStart(2, '0');
          const yearNumber = day.getFullYear();
          day = `${yearNumber}-${monthNumber}-${dayNumber}`;
        } else if (typeof day === 'string') {
          if (day.includes('.')) {
            const [dayNumber, monthNumber, yearNumber] = day.split('.').map(Number);
            day = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
          }
        } else {
          console.error('Не удалось обработать дату:', day);
          return null;
        }
  
        return { [day]: hours };
      }).filter(row => row !== null);
  
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
      <span className="text-lg font-semibold text-gray-700">Объемные Тарифы</span>
      <div className="flex items-center ml-24 space-x-4">
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
          {data.subjects.map((subject, index) => (
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
        <button onClick={handleSuperButtonClick} className="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none">
          {loading.superButton ? (
            <span>Загрузка...</span>
          ) : (
            <>
              <ArrowUpOnSquareIcon className="h-5 w-5 mr-1" />
              Супер Кнопка
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navbar;

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
    const rows = data.tableData.map(dayData => {
      const day = Object.keys(dayData)[0];
      const row = [day.split('-').reverse().join('.')]; // Date in format dd.mm.yyyy
      row.push(...dayData[day]);
      return row;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Фактические Тарифы");

    const fileName = `Фактическе_тариффы_${data.tariffType}_${date.year}-${String(date.month + 1).padStart(2, '0')}.xlsx`;
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
        const [day, ...hours] = row;
        const [dayNumber, monthNumber, yearNumber] = day.split('.').map(Number);
        const dayString = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        return { [dayString]: hours };
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
          <option value="OD_T">OD_T</option>
          <option value="BE_T">BE_T</option>
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

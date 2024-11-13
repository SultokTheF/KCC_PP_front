// FormConstructor.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../../Sidebar/Sidebar";
import { axiosInstance, endpoints } from "../../../../../../services/apiConfig";
import TableComponent from "./TableComponent";
import useFetchData from './useFetchData';
import { processTableData, getRowName } from './utils';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { useAuth } from "../../../../../../hooks/useAuth";
import { Circles } from 'react-loader-spinner';

const FormConstructor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subjectList, tables, setTables } = useFetchData(id);

  // States
  const [visibleSubTables, setVisibleSubTables] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allObjects, setAllObjects] = useState([]);
  const [objectsList, setObjectsList] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);

  // Function to fetch all objects
  const fetchAllObjects = async () => {
    try {
      const objectsResponse = await axiosInstance.get(endpoints.OBJECTS);
      setAllObjects(objectsResponse.data);
    } catch (error) {
      console.error('Error fetching all objects:', error);
    }
  };

  // Fetch objects based on selected subject
  const fetchObjects = async (subjectId) => {
    try {
      const objectsResponse = await axiosInstance.get(endpoints.OBJECTS, {
        params: { sub: subjectId },
      });
      setObjectsList(objectsResponse.data);
      setSelectedObjects(objectsResponse.data.map((obj) => obj.id));
    } catch (error) {
      console.error('Error fetching objects:', error);
    }
  };

  useEffect(() => {
    fetchAllObjects();
  }, []);

  // Redirect if user does not have permission
  useEffect(() => {
    if (tables.length > 0) {
      const table = tables[0];
      if (!table.users.includes(user.id)) {
        navigate('/forms/table/');
      }
    }
  }, [tables, user.id, navigate]);

  // Handle Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    tables.forEach((table, tableIndex) => {
      table.tableConfig.forEach((item, itemIndex) => {
        const wsData = [];

        // Header row
        const header = ['Дата'];
        if (table.groupByHour) {
          header.push('Час');
        }
        header.push('Субъект');
        item.data.forEach((res) => {
          header.push(res.name);
        });
        wsData.push(header);

        // Data rows
        if (item.data[0]?.date_value?.length > 0) {
          const dateValueMap = {};
          item.data.forEach((res) => {
            res.date_value.forEach((dateItem) => {
              const date = dateItem.date;
              const value = dateItem.value;
              if (!dateValueMap[date]) {
                dateValueMap[date] = {};
              }
              if (Array.isArray(value)) {
                value.forEach((hourItem) => {
                  const hour = hourItem.hour;
                  if (!dateValueMap[date][hour]) {
                    dateValueMap[date][hour] = {};
                  }
                  dateValueMap[date][hour][res.name] = hourItem.value;
                });
              } else {
                dateValueMap[date][res.name] = value;
              }
            });
          });

          Object.keys(dateValueMap).forEach((date) => {
            if (table.groupByHour) {
              Object.keys(dateValueMap[date]).forEach((hour) => {
                const row = [
                  date,
                  hour,
                  getRowName(subjectList, allObjects, item.subject, item.objects),
                ];
                item.data.forEach((res) => {
                  const value = dateValueMap[date][hour][res.name];
                  row.push(value !== null && value !== undefined ? value : '-');
                });
                wsData.push(row);
              });
            } else {
              const row = [
                date,
                getRowName(subjectList, allObjects, item.subject, item.objects),
              ];
              item.data.forEach((res) => {
                const value = dateValueMap[date][res.name];
                row.push(value !== null && value !== undefined ? value : '-');
              });
              wsData.push(row);
            }
          });
        } else {
          const row = [
            table.startDate || '-',
            getRowName(subjectList, allObjects, item.subject, item.objects),
          ];
          item.data.forEach((res) => {
            const value = res.value;
            row.push(value !== null && value !== undefined ? value : '-');
          });
          wsData.push(row);
        }

        // Create worksheet and add to workbook
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        let sheetName = `${table.name}_${getRowName(
          subjectList,
          allObjects,
          item.subject,
          item.objects
        )}`;

        if (sheetName.length > 31) {
          sheetName = sheetName.substring(0, 31);
        }

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
    });

    XLSX.writeFile(wb, 'exported_tables.xlsx');
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        {tables.length === 0 ? (
          <div>Загрузка таблицы...</div> // "Loading table..."
        ) : (
          tables.map((table, tableIndex) => (
            <TableComponent
              key={table.id || tableIndex} // Use unique table ID or fallback to index as key
              table={table}
              tableIndex={tableIndex}
              subjectList={subjectList}
              visibleSubTables={visibleSubTables}
              setVisibleSubTables={setVisibleSubTables}
              allObjects={allObjects}
              exportToExcel={exportToExcel}
            />
          ))
        )}

        {isSubmitting && (
          <div className="flex justify-center mt-4">
            <Circles color="#00BFFF" height={80} width={80} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FormConstructor;

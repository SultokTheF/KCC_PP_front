import { useState, useEffect } from 'react';
import { axiosInstance, endpoints } from '../../../../../../services/apiConfig';
import { processTableData } from './utils';

const useFetchData = (id) => {
  const [subjectList, setSubjectList] = useState([]);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch subjects
        const subjectsResponse = await axiosInstance.get(endpoints.SUBJECTS);
        setSubjectList(subjectsResponse.data);

        // Fetch table data by id
        const tableResponse = await axiosInstance.get(endpoints.TABLE(id));
        const tablesData = Array.isArray(tableResponse.data)
          ? tableResponse.data
          : [tableResponse.data];
        const newTables = tablesData.map(processTableData);
        setTables(newTables);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
      }
    };

    fetchInitialData();
  }, [id]);

  return { subjectList, tables, setTables };
};

export default useFetchData;
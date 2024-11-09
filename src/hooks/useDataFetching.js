// src/hooks/useDataFetching.js
import { useState, useEffect } from 'react';
import { axiosInstance, endpoints } from '../services/apiConfig';

const useDataFetching = (selectedDate, selectedId, type) => {
  const [daysList, setDaysList] = useState([]);
  const [hoursList, setHoursList] = useState([]);

  useEffect(() => {
    const fetchDaysAndHours = async () => {
      if (selectedDate && selectedId) {
        try {
          // Fetch days
          const daysResponse = await axiosInstance.get(endpoints.DAYS, {
            params: {
              day: selectedDate,
              [type === 'subject' ? 'sub' : 'obj']: selectedId,
            },
          }).catch((error) => {
            if (error.response && error.response.status === 404) {
              return { data: [] }; // Return an empty array if no days are found
            }
            throw error;
          });
          const allDays = daysResponse.data || [];
          setDaysList(allDays);

          // Fetch hours
          if (allDays.length > 0) {
            const dayPlan = allDays[0]; // Assuming the first dayPlan
            const hoursResponse = await axiosInstance.get(endpoints.HOURS, {
              params: {
                day: selectedDate,
                [type === 'subject' ? 'sub' : 'obj']: selectedId,
              },
            }).catch((error) => {
              if (error.response && error.response.status === 404) {
                return { data: [] }; // Return an empty array if no hours are found
              }
              throw error;
            });
            setHoursList(hoursResponse.data);
          } else {
            setHoursList([]); // No dayPlan, so no hours
          }
        } catch (error) {
          console.error('Error fetching days and hours:', error);
          setDaysList([]); // Reset days list to empty on error
          setHoursList([]); // Reset hours list to empty on error
        }
      } else {
        setDaysList([]);
        setHoursList([]);
      }
    };

    fetchDaysAndHours();
  }, [selectedDate, selectedId, type]);

  return { daysList, hoursList };
};

export default useDataFetching;

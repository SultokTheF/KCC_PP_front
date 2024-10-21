// utils.js
import { v4 as uuidv4 } from 'uuid';

export const processCombinedTableData = (tableData, subjectList, objectList) => {
  try {
    const { tableConfig, objectConfig } = tableData;

    console.log("Table Config:", tableConfig);
    console.log("Object Config:", objectConfig);

    if (!tableConfig || !objectConfig) {
      console.error("Table data is missing tableConfig or objectConfig");
      return [];
    }

    const combinedData = [];

    tableConfig.forEach(subjectItem => {
      const subjectName = getSubjectName(subjectList, subjectItem.subject);

      // Find objects associated with this subject
      const relatedObjects = objectConfig.filter(obj => obj.subject === subjectItem.subject);

      console.log(`Processing Subject: ${subjectName}, Operations: ${subjectItem.data.length}`);

      subjectItem.data.forEach(subjectData => {
        const { name: operationName, date_value } = subjectData;

        console.log(`Processing Operation: ${operationName}`);

        if (!date_value) {
          console.warn(`No date_value for operation ${operationName} of subject ${subjectName}`);
          return;
        }

        date_value.forEach(dateEntry => {
          const { date, value: hourValues } = dateEntry;

          hourValues.forEach(hourEntry => {
            const { hour, value: subjectValue } = hourEntry;

            relatedObjects.forEach(objectItem => {
              const objectName = getObjectName(objectList, objectItem.object);
              const objectOperation = objectItem.data.find(op => op.name === operationName);

              let objectValue = '-'; // Default value

              if (objectOperation) {
                const objectDateEntry = objectOperation.date_value.find(d => d.date === date);
                if (objectDateEntry) {
                  const objectHourEntry = objectDateEntry.value.find(h => h.hour === hour);
                  if (objectHourEntry) {
                    objectValue = objectHourEntry.value;
                  }
                }
              }

              combinedData.push({
                date,
                hour,
                subjectName,
                operationName,
                subjectValue,
                objectName,
                objectValue,
              });
            });
          });
        });
      });
    });

    console.log("Combined Data:", combinedData);
    return combinedData;
  } catch (error) {
    console.error("Error processing combined table data:", error);
    return [];
  }
};


export const processTableData = (tableData) => {
  const {
    name,
    start_date,
    end_date,
    group_by_date,
    group_by_hour,
    data,
    exclude_holidays,
  } = tableData;

  // Ensure data is not null or undefined
  const safeData = data || { subjects: [], objects: [] };

  // Organize data by subjects
  const subjectsMap = {};
  (safeData.subjects || []).forEach((subject) => {
    if (!subjectsMap[subject.subject]) {
      subjectsMap[subject.subject] = {
        subject: subject.subject,
        data: [],
      };
    }
    subjectsMap[subject.subject].data.push({
      ...subject,
      id: uuidv4(),
    });
  });

  // Organize data by objects
  const objectsMap = {};
  (safeData.objects || []).forEach((object) => {
    if (!objectsMap[object.object]) {
      objectsMap[object.object] = {
        object: object.object,
        subject: object.subject, // Store the associated subject for display
        data: [],
      };
    }
    objectsMap[object.object].data.push({
      ...object,
      id: uuidv4(),
    });
  });

  return {
    name: name || "Без названия",
    startDate: start_date ? new Date(start_date).toISOString().split("T")[0] : "",
    endDate: end_date ? new Date(end_date).toISOString().split("T")[0] : "",
    groupByDate: group_by_date || false,
    groupByHour: group_by_hour || false,
    excludeHolidays: exclude_holidays || {
      Russia: false,
      Kazakhstan: false,
      Weekend: false,
    },
    tableConfig: Object.values(subjectsMap),
    objectConfig: Object.values(objectsMap),
  };
};

export const getSubjectName = (subjectList, id) => {
  const subject = subjectList.find((s) => s.id === id);
  return subject ? subject.subject_name : "Неизвестный субъект";
};

export const getObjectName = (objectList, id) => {
  const object = objectList.find((o) => o.id === id);
  return object ? object.object_name : "Неизвестный объект";
};

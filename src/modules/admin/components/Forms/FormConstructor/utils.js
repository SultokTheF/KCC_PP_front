import { v4 as uuidv4 } from 'uuid';


// Merge data entries based on subject, objects, plan, name, operation, and params
export const mergeDataEntries = (dataEntries) => {
  const mergedEntries = [];

  dataEntries.forEach((entry) => {
    const existingEntry = mergedEntries.find(
      (e) =>
        e.subject === entry.subject &&
        arraysEqual(e.objects, entry.objects) &&
        e.plan === entry.plan &&
        e.name === entry.name &&
        e.operation === entry.operation &&
        JSON.stringify(e.params) === JSON.stringify(entry.params)
    );

    if (existingEntry) {
      existingEntry.date_value = existingEntry.date_value.concat(entry.date_value);
    } else {
      mergedEntries.push({ ...entry });
    }
  });

  return mergedEntries;
};

// Helper function to compare two arrays (order-insensitive)
const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

// Process table data, grouping by subject and objects
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

  // Organize data by subject and objects
  const subjectsMap = {};
  (data || []).forEach((result) => {
    const key = `${result.subject}_${result.objects.sort().join(',')}`;
    if (!subjectsMap[key]) {
      subjectsMap[key] = {
        subject: result.subject,
        objects: result.objects.sort(),
        data: [],
      };
    }
    subjectsMap[key].data.push({
      ...result,
      // Ensure each result has a unique identifier
      id: uuidv4(),
    });
  });

  // Merge data entries for each subject and objects
  Object.values(subjectsMap).forEach((subjectItem) => {
    subjectItem.data = mergeDataEntries(subjectItem.data);
  });

  return {
    name: name || "Без названия",
    startDate: start_date
      ? new Date(start_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    endDate: end_date
      ? new Date(end_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    groupByDate: group_by_date || false,
    groupByHour: group_by_hour || false,
    excludeHolidays: exclude_holidays || {
      Russia: false,
      Kazakhstan: false,
      Weekend: false,
    },
    tableConfig: Object.values(subjectsMap),
  };
};

// Get subject name
export const getSubjectName = (subjectList, id) => {
  const subject = subjectList.find((s) => s.id === id);
  return subject ? subject.subject_name : "Неизвестный субъект";
};

// Get object names from objectsList based on object IDs
export const getObjectNames = (allObjects, objectIds) => {
  return allObjects
    .filter(obj => objectIds.includes(obj.id))
    .map(obj => obj.object_name) // Ensure you're accessing the correct property name
    .join(', ');
};

// Get row name combining subject name and object names
export const getRowName = (subjectList, allObjects, subjectId, objectIds) => {
  const subjectName = getSubjectName(subjectList, subjectId);
  const objectNames = getObjectNames(allObjects, objectIds); // Now using allObjects
  return `${subjectName} (${objectNames})`;
};

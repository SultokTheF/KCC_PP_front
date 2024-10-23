// utils.js

import { v4 as uuidv4 } from 'uuid';

/**
 * Helper function to compare two arrays (order-insensitive).
 * @param {Array} a 
 * @param {Array} b 
 * @returns {boolean}
 */
export const arraysEqual = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

/**
 * Merges data entries based on subject, objects, plan, name, operation, and params.
 * @param {Array} dataEntries 
 * @returns {Array}
 */
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

/**
 * Processes the raw table data fetched from the server.
 * Ensures that the 'objects' field is always an array.
 * @param {Object} tableData - The raw table data fetched from the server.
 * @returns {Object} - The processed table data.
 */
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
    const key = `${result.subject}_${(result.objects || []).sort().join(',')}`;
    if (!subjectsMap[key]) {
      subjectsMap[key] = {
        subject: result.subject,
        objects: Array.isArray(result.objects) ? result.objects.slice().sort((a, b) => a - b) : [],
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

/**
 * Generates a display name for a row based on subject and objects.
 * Handles cases where objects might be an empty array.
 * @param {Array} subjectList - List of all subjects.
 * @param {Array} allObjects - List of all objects.
 * @param {number} subjectId - The ID of the subject.
 * @param {Array} objectIds - The IDs of the objects.
 * @returns {string} - The formatted row name.
 */
export const getRowName = (subjectList, allObjects, subjectId, objectIds) => {
  const subject = subjectList.find((subj) => subj.id === subjectId);
  const subjectName = subject ? subject.subject_name : 'Unknown Subject';

  if (Array.isArray(objectIds) && objectIds.length > 0) {
    const objects = allObjects.filter((obj) => objectIds.includes(obj.id));
    const objectNames = objects.map((obj) => obj.object_name).join(', ');
    return `${subjectName} - ${objectNames}`;
  }

  // If no objects are associated, return only the subject name with a placeholder
  return `${subjectName} - Без объектов`; // "Без объектов" means "No Objects" in Russian
};

/**
 * Get subject name by ID.
 * @param {Array} subjectList 
 * @param {number} id 
 * @returns {string}
 */
export const getSubjectName = (subjectList, id) => {
  const subject = subjectList.find((s) => s.id === id);
  return subject ? subject.subject_name : "Неизвестный субъект"; // "Unknown Subject"
};

/**
 * Get object names from allObjects based on object IDs.
 * @param {Array} allObjects 
 * @param {Array} objectIds 
 * @returns {string}
 */
export const getObjectNames = (allObjects, objectIds) => {
  return allObjects
    .filter(obj => objectIds.includes(obj.id))
    .map(obj => obj.object_name) // Ensure you're accessing the correct property name
    .join(', ');
};
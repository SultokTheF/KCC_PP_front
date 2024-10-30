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
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, index) => value === sortedB[index]);
};

/**
 * Merges data entries based on subject, objects, plan, name, operation, and params.
 * @param {Array} dataEntries 
 * @returns {Array}
 */
export const mergeDataEntries = (dataEntries) => {
  const mergedMap = new Map();

  dataEntries.forEach((entry) => {
    // Ensure 'objects' is a sorted array
    const sortedObjects = Array.isArray(entry.objects) ? [...entry.objects].sort((a, b) => a - b) : [];
    // Ensure 'params' is a sorted array if applicable
    const sortedParams = Array.isArray(entry.params) ? [...entry.params].sort() : [];
    const key = `${entry.subject}_${sortedObjects.join(',')}_${entry.plan}_${entry.name}_${entry.operation}_${JSON.stringify(sortedParams)}`;

    if (mergedMap.has(key)) {
      const existingEntry = mergedMap.get(key);
      existingEntry.date_value = existingEntry.date_value.concat(entry.date_value);
    } else {
      mergedMap.set(key, { ...entry });
    }
  });

  return Array.from(mergedMap.values());
};

/**
 * Processes the raw table data fetched from the server.
 * Ensures that the 'objects' field is always an array and 'params' is consistently defined.
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
    users, // Include the 'users' field
  } = tableData;

  // Organize data by subject and objects
  const subjectsMap = {};
  (data || []).forEach((result) => {
    const sortedObjects = Array.isArray(result.objects) ? [...result.objects].sort((a, b) => a - b) : [];
    const key = `${result.subject}_${sortedObjects.join(',')}`;

    if (!subjectsMap[key]) {
      subjectsMap[key] = {
        subject: result.subject,
        objects: sortedObjects,
        data: [],
      };
    }

    subjectsMap[key].data.push({
      ...result,
      id: uuidv4(),
      params: Array.isArray(result.params) ? [...result.params].sort() : [], // Ensure 'params' is always a sorted array
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
    users: users || [], // Preserve the 'users' array
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

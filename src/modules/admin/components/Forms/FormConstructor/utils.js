import { v4 as uuidv4 } from 'uuid';

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

  // Organize data by subjects
  const subjectsMap = {};
  (data.subjects || []).forEach((subject) => {
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
  (data.objects || []).forEach((object) => {
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
}
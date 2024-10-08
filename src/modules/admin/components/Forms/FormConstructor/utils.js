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

  // Organize data by subject
  const subjectsMap = {};
  (data || []).forEach((result) => {
    if (!subjectsMap[result.subject]) {
      subjectsMap[result.subject] = {
        subject: result.subject,
        data: [],
      };
    }
    subjectsMap[result.subject].data.push({
      ...result,
      // Ensure each result has a unique identifier
      id: uuidv4(),
    });
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

export const getSubjectName = (subjectList, id) => {
  const subject = subjectList.find((s) => s.id === id);
  return subject ? subject.subject_name : "Неизвестный субъект";
};

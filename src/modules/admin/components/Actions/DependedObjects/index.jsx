/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import Sidebar from "../../Sidebar/Sidebar";
import Calendar from "./Calendar/Calendar";
import { axiosInstance, endpoints } from "../../../../../services/apiConfig";

import ObjectsTable from "./ObjectsTable";
import DependedObjectsTable from "./DependedOjbectsTable";

const DependedObjects = () => {
  const [data, setData] = useState({ objects: [] });
  const [objects, setObjects] = useState([]);
  const [depededObjects, setDepededObjects] = useState([]);
  const [relatedObjects, setRelatedObjects] = useState([]);
  // relatedObjectsID is used for the PUT request URL
  const [relatedObjectsID, setRelatedObjectsID] = useState();
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  // Fetch full objects list (to populate selects, etc.)
  const fetchObjects = async () => {
    try {
      const response = await axiosInstance.get(endpoints.OBJECTS);
      setObjects(response.data);
    } catch (error) {
      console.error("Error fetching objects:", error);
    }
  };

  // Fetch the depended objects structure for the selected month
  const fetchDepededObjects = async () => {
    try {
      const response = await axiosInstance.get(endpoints.DEPENDED_OBJECTS, {
        params: {
          date: `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-01`,
        },
      });
      if (response.data.length > 0 && !selectedObject) {
        // Automatically select the first root object if none is set
        setSelectedObject(response.data[0].root_object);
      }
      setDepededObjects(response.data);
    } catch (error) {
      console.error("Error fetching depended objects:", error);
    }
  };

  // Fetch the related (dependent) objects details for the current root object
  const fetchRelatedObjects = async () => {
    try {
      const response = await axiosInstance.get(endpoints.DEPENDED_OBJECTS, {
        params: {
          date: `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-01`,
          root_object: selectedObject,
        },
      });
      // Use depended_objects_details (fallback to an empty array)
      setRelatedObjects(response.data[0]?.depended_objects_details || []);
      setRelatedObjectsID(response.data[0]?.id || 0);
    } catch (error) {
      console.error("Error fetching related objects:", error);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  useEffect(() => {
    fetchDepededObjects();
  }, [selectedMonth.month, selectedMonth.year]);

  useEffect(() => {
    if (selectedObject) {
      fetchRelatedObjects();
    }
  }, [selectedObject, selectedMonth.month, selectedMonth.year]);

  // --- Handlers for managing dependent objects in the related objects table ---

  // Append a new dependent if not already added (via ObjectsTable callback from DependedObjectsTable)
  const handleAddDependent = (newDependentId) => {
    const newObj = objects.find(
      (obj) => String(obj.id) === String(newDependentId)
    );
    if (
      newObj &&
      !relatedObjects.some(
        (obj) => String(obj.object_id) === String(newObj.id)
      )
    ) {
      const newDependentObj = {
        object_id: newObj.id,
        object_name: newObj.object_name,
        object_type: newObj.object_type,
        hours: [] // start with an empty hours array
      };
      setRelatedObjects([...relatedObjects, newDependentObj]);
    }
  };

  // Remove a dependent object (via its object_id)
  const handleDeleteDependent = (dependentId) => {
    setRelatedObjects(
      relatedObjects.filter(
        (obj) => String(obj.object_id) !== String(dependentId)
      )
    );
  };

  // Build the JSON configuration preview
  const jsonConfig = {
    root_object: selectedObject,
    depended_objects: relatedObjects.map((obj) => obj.object_id),
    month: `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}`
  };

  // Handler for sending the configuration via a PUT request
  const handleSendConfiguration = async () => {
    try {
      const response = await axiosInstance.put(
        `${endpoints.DEPENDED_OBJECTS}${relatedObjectsID}/`,
        jsonConfig
      );
      window.alert("Configuration successfully sent!");
      console.log("Configuration sent:", response.data);
    } catch (error) {
      console.error("Error sending configuration", error);
      window.alert("Error sending configuration");
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        <Calendar
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          data={data}
          setData={setData}
        />

        <div className="mt-4 flex flex-col space-y-8">
          {/* Root Objects Section */}
          <div>
            <ObjectsTable
              objects={objects}
              dependedObjects={depededObjects}
              selectedObject={selectedObject}
              setSelectedObject={setSelectedObject}
              selectedMonth={selectedMonth}
              refreshDependedObjects={fetchDepededObjects}
            />
          </div>

          {/* Dependent Objects Section */}
          <div>
            <DependedObjectsTable
              objects={objects}
              relatedObjects={relatedObjects}
              onAddDependent={handleAddDependent}
              onDeleteDependent={handleDeleteDependent}
              onSend={handleSendConfiguration}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DependedObjects;

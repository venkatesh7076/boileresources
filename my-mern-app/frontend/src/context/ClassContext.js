import React, { createContext, useContext, useState } from 'react';

const ClassContext = createContext();

export const useClassContext = () => useContext(ClassContext);

export const ClassProvider = ({ children }) => {
  const [userClasses, setUserClasses] = useState(() => {
    return JSON.parse(localStorage.getItem("userClasses")) || [];
  });

  const [completedClasses, setCompletedClasses] = useState(() => {
    return JSON.parse(localStorage.getItem("completedClasses")) || [];
  });

  const handleAddClass = (newClass, isCompleted = false) => {
    if (isCompleted) {
      // Add directly to completed classes
      const updatedCompleted = [...completedClasses, newClass];
      setCompletedClasses(updatedCompleted);
      localStorage.setItem("completedClasses", JSON.stringify(updatedCompleted));
    } else {
      // Add to enrolled classes
      const updatedEnrolled = [...userClasses, newClass];
      setUserClasses(updatedEnrolled);
      localStorage.setItem("userClasses", JSON.stringify(updatedEnrolled));
    }
  };

  return (
    <ClassContext.Provider value={{ userClasses, completedClasses, handleAddClass }}>
      {children}
    </ClassContext.Provider>
  );
};
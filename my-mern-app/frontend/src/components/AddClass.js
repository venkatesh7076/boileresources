import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Mock data for demonstration purposes
const availableClasses = [
  { id: 1, code: "CS18000", name: "Problem Solving and Object-Oriented Programming", credits: 4 },
  { id: 2, code: "CS25100", name: "Data Structures and Algorithms", credits: 3 },
  { id: 3, code: "CS25200", name: "Systems Programming", credits: 3 },
  { id: 4, code: "MA16500", name: "Analytic Geometry and Calculus I", credits: 4 },
  { id: 5, code: "MA16600", name: "Analytic Geometry and Calculus II", credits: 4 },
  { id: 6, code: "PHYS17200", name: "Modern Mechanics", credits: 4 },
  { id: 7, code: "ENGL10600", name: "First-Year Composition", credits: 4 },
  { id: 8, code: "CS30700", name: "Software Engineering", credits: 3 },
  { id: 9, code: "CS35200", name: "Compilers: Principles and Practice", credits: 3 },
  { id: 10, code: "CS38100", name: "Introduction to Analysis of Algorithms", credits: 3 },
];

const AddClass = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [completedClasses, setCompletedClasses] = useState([]);

  useEffect(() => {
    // Load existing user classes
    const classes = JSON.parse(localStorage.getItem('userClasses')) || [];
    setUserClasses(classes.filter(classItem => !classItem.completed));
    setCompletedClasses(classes.filter(classItem => classItem.completed));
  }, []);

  useEffect(() => {
    // Filter classes based on search term
    if (searchTerm.trim() === "") {
      setSearchResults([]);
    } else {
      const filteredResults = availableClasses.filter(classItem => 
        classItem.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filteredResults);
    }
  }, [searchTerm]);

  const handleAddClass = (classItem) => {
    // Check if class is already added
    const isAlreadyAdded = userClasses.some(c => c.code === classItem.code);
    if (!isAlreadyAdded) {
      const updatedClasses = [...userClasses, classItem];
      setUserClasses(updatedClasses);
      localStorage.setItem('userClasses', JSON.stringify(updatedClasses));
    }
  };

  const handleRemoveClass = (classCode) => {
    const updatedClasses = userClasses.filter(c => c.code !== classCode);
    const updatedCompletedClasses = completedClasses.filter(c => c.code !== classCode);
    setUserClasses(updatedClasses);
    setCompletedClasses(updatedCompletedClasses);
    localStorage.setItem('userClasses', JSON.stringify([...updatedClasses, ...updatedCompletedClasses]));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-yellow-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">BoileResources</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Search and Add Classes</h1>
          
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by class code or name (e.g., CS18000 or Calculus)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-700"
            />
          </div>
          
          {/* Search Results */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((classItem) => {
                  const isAdded = userClasses.some(c => c.code === classItem.code) || completedClasses.some(c => c.code === classItem.code);
                  return (
                    <div key={classItem.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{classItem.code}</h3>
                        <p>{classItem.name}</p>
                        <p className="text-sm text-gray-600">Credits: {classItem.credits}</p>
                      </div>
                      <button
                        onClick={() => handleAddClass(classItem)}
                        disabled={isAdded}
                        className={`px-4 py-2 rounded-lg ${
                          isAdded 
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                            : 'bg-yellow-700 text-white hover:bg-yellow-800'
                        } transition`}
                      >
                        {isAdded ? 'Added' : 'Add Class'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">
                {searchTerm.trim() === "" 
                  ? "Type in the search box to find classes" 
                  : "No classes found matching your search term"}
              </p>
            )}
          </div>
          
          {/* Currently Added Classes */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Selected Classes</h2>
            {userClasses.length > 0 ? (
              <div className="space-y-4">
                {userClasses.map((classItem, index) => (
                  <div key={index} className="border rounded-lg p-4 flex justify-between items-center bg-gray-50">
                    <div>
                      <h3 className="font-semibold">{classItem.code}</h3>
                      <p>{classItem.name}</p>
                      <p className="text-sm text-gray-600">Credits: {classItem.credits}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveClass(classItem.code)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">You haven't added any classes yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClass;
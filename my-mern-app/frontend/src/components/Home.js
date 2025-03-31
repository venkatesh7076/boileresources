import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const API_URL = "http://localhost:5001"; 
const MIN_CREDIT_HOURS = 12;

const Home = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userClasses, setUserClasses] = useState([]);
  const [completedClasses, setCompletedClasses] = useState([]);
  const [user, setUser] = useState(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    // Load completed classes from localStorage
    const completed = JSON.parse(localStorage.getItem('completedClasses')) || [];
    setCompletedClasses(completed);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Authentication failed");
        }

        const data = await res.json();
        setUser(data);
        fetchUserClasses(data._id);
      } catch (err) {
        console.error("❌ Auth check failed:", err);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const fetchUserClasses = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/courses/user/${userId}/enrolled`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch enrolled classes");
      }

      const data = await res.json();
      setUserClasses(data);
      setTotalCredits(data.reduce((sum, classItem) => sum + (classItem.creditHours || 0), 0));
    } catch (err) {
      console.error("❌ Error fetching enrolled classes:", err);
      setErrorMessage(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const logoutResponse = await fetch(`${API_URL}/api/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (!logoutResponse.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  const handleAddClass = () => navigate('/add-class');
  const handleDeleteClass = () => navigate('/delete-class');
  const handleDeleteCompletedClass = () => navigate('/delete-completed-class');
  const handleViewProfile = () => navigate('/profile');
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const handleFeedbackForm = () => navigate('/feedback');

  const handleMarkAsComplete = (classToComplete) => {
    // Create a completed class object with consistent property names
    const completedClass = {
      _id: classToComplete._id,
      code: classToComplete.courseCode,
      name: classToComplete.title,
      credits: classToComplete.creditHours,
      completed: true
    };

    // Remove from enrolled classes by calling the API
    if (user && user._id) {
      // This would normally make an API call to unenroll
      // For now, we'll just remove it locally
      const updatedEnrolled = userClasses.filter((c) => c._id !== classToComplete._id);
      setUserClasses(updatedEnrolled);
      setTotalCredits(updatedEnrolled.reduce((sum, item) => sum + (item.creditHours || 0), 0));
    }

    // Add to completed classes in localStorage
    const updatedCompleted = [...completedClasses, completedClass];
    setCompletedClasses(updatedCompleted);
    localStorage.setItem('completedClasses', JSON.stringify(updatedCompleted));
  };

  const handleRemoveCompletedClass = (classToRemove) => {
    // Filter out the class to be removed
    const updatedCompleted = completedClasses.filter((c) => c._id !== classToRemove._id);
    setCompletedClasses(updatedCompleted);
    localStorage.setItem("completedClasses", JSON.stringify(updatedCompleted));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">Boiler Resources</span>
            </div>
            <div className="relative flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-white">Welcome, {user.username}!</span>
                  <ThemeToggle />
                  <div className="relative">
                    <button
                      onClick={toggleDropdown}
                      className="text-white bg-black dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 6h16M4 12h16m-7 6h7"
                        ></path>
                      </svg>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-2 z-20">
                        <button
                          onClick={handleViewProfile}
                          className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={handleFeedbackForm}
                          className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Feedback Form
                        </button>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-white">Welcome, Guest!</span>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Welcome to Boiler Resources</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This is your dashboard where you can access and manage your resources.
          </p>
        </div>

        {/* User's Current Classes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user ? `${user.username}'s` : 'Your'} Enrolled Classes</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Credits: {totalCredits} 
                {totalCredits < MIN_CREDIT_HOURS && 
                  <span className="text-red-500 dark:text-red-400 ml-2">
                    (Minimum: {MIN_CREDIT_HOURS})
                  </span>
                }
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAddClass}
                className="bg-yellow-700 dark:bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition"
              >
                Add Class
              </button>
              <button 
                onClick={handleDeleteClass}
                className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
              >
                Delete Class
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}

          {userClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userClasses.map((classItem) => (
                <div 
                  key={classItem._id} 
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{classItem.courseCode}</h3>
                  <p className="text-gray-800 dark:text-gray-200">{classItem.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Credits: {classItem.creditHours}</p>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => navigate(`/class/${classItem._id}`)}
                      className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                    >
                      Details
                    </button>
                    <button 
                      onClick={() => handleMarkAsComplete(classItem)}
                      className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition"
                    >
                      Mark as Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">You haven't added any classes yet. Click "Add Class" to get started.</p>
          )}
        </div>
        
        {/* User's Completed Classes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user ? `${user.username}'s` : 'Your'} Completed Classes</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Keep track of the courses you've already completed.
              </p>
            </div>
          </div>
          
          {completedClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedClasses.map((classItem, index) => (
                <div key={classItem._id || index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{classItem.code}</h3>
                  <p className="text-gray-800 dark:text-gray-200">{classItem.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Credits: {classItem.credits}</p>
                  <button 
                    onClick={() => handleRemoveCompletedClass(classItem)}
                    className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">You don't have any completed classes yet. Mark classes as complete from your enrolled classes.</p>
          )}
        </div>

        {/* Resource Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">My Resources</h2>
            <p className="text-gray-600 dark:text-gray-400">View and manage your saved resources</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Browse Categories</h2>
            <p className="text-gray-600 dark:text-gray-400">Explore resources by category</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Community</h2>
            <p className="text-gray-600 dark:text-gray-400">Connect with other users</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
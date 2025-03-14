import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const API_URL = "http://localhost:5001";

const ResourcesPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState(null);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    resourceUrl: "",
    resourceType: "pdf", // Default type
    file: null,
  });

  // Fetch user data and check authentication
  useEffect(() => {
    const fetchUser = async () => {
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
      } catch (err) {
        console.error("❌ Auth check failed:", err);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  // Fetch class details and resources
  useEffect(() => {
    const fetchClassDetails = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/courses/${classId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch class details");
        }

        const data = await res.json();
        setClassDetails(data);
      } catch (err) {
        console.error("❌ Error fetching class details:", err);
        setErrorMessage("Failed to load class details");
      }
    };

    const fetchResources = async () => {
      try {
        const res = await fetch(`${API_URL}/api/resources/class/${classId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch resources");
        }

        const data = await res.json();
        setResources(data);
      } catch (err) {
        console.error("❌ Error fetching resources:", err);
        setErrorMessage("Failed to load resources");
      } finally {
        setIsLoading(false);
      }
    };

    if (classId) {
      fetchClassDetails();
      fetchResources();
    }
  }, [classId]);

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

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const handleViewProfile = () => navigate("/profile");
  const handleGoBack = () => navigate(-1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewResource((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setNewResource((prev) => ({
      ...prev,
      file: e.target.files[0],
    }));
  };

  const handleUploadResource = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", newResource.title);
      formData.append("description", newResource.description);
      formData.append("resourceType", newResource.resourceType);
      formData.append("courseId", classId);

      if (newResource.resourceUrl) {
        formData.append("resourceUrl", newResource.resourceUrl);
      }

      if (newResource.file) {
        formData.append("resourceFile", newResource.file);
      }

      const response = await fetch(`${API_URL}/api/resources/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload resource");
      }

      const uploadedResource = await response.json();

      // Update resources list with the new resource
      setResources((prev) => [...prev, uploadedResource]);

      // Reset form
      setNewResource({
        title: "",
        description: "",
        resourceUrl: "",
        resourceType: "pdf",
        file: null,
      });

      setShowUploadForm(false);
    } catch (err) {
      console.error("❌ Error uploading resource:", err);
      setErrorMessage("Failed to upload resource: " + err.message);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/resources/${resourceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      // Remove deleted resource from the list
      setResources((prev) =>
        prev.filter((resource) => resource._id !== resourceId)
      );
    } catch (err) {
      console.error("❌ Error deleting resource:", err);
      setErrorMessage("Failed to delete resource: " + err.message);
    }
  };

  const getResourceTypeIcon = (type) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "video":
        return "🎥";
      case "link":
        return "🔗";
      case "notes":
        return "📝";
      case "image":
        return "🖼️";
      default:
        return "📁";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Loading...
        </div>
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
              <span
                className="text-white text-xl font-bold cursor-pointer"
                onClick={() => navigate("/")}
              >
                Boiler Resources
              </span>
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
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="mb-4 flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back to Dashboard
        </button>

        {/* Class Details */}
        {classDetails && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              {classDetails.courseCode}: {classDetails.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {classDetails.description || "No description available"}
            </p>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span className="mr-4">Credits: {classDetails.creditHours}</span>
              {classDetails.instructor && (
                <span>Instructor: {classDetails.instructor}</span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-lg my-4">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        {/* Resources List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Resources for this Class
            </h2>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-yellow-700 dark:bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition"
            >
              {showUploadForm ? "Cancel Upload" : "Upload Resource"}
            </button>
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Upload a New Resource
              </h3>
              <form onSubmit={handleUploadResource}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newResource.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Resource Type
                    </label>
                    <select
                      name="resourceType"
                      value={newResource.resourceType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="video">Video</option>
                      <option value="link">External Link</option>
                      <option value="notes">Notes</option>
                      <option value="image">Image</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newResource.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    External URL (optional)
                  </label>
                  <input
                    type="url"
                    name="resourceUrl"
                    value={newResource.resourceUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/resource"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload File (optional)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Max file size: 10MB. Supported formats: PDF, DOC, DOCX, JPG,
                    PNG
                  </p>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Upload Resource
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Resources List Display */}
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource) => (
                <div
                  key={resource._id}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 flex flex-col"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">
                        {getResourceTypeIcon(resource.resourceType)}
                      </span>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-1">
                        {resource.title}
                      </h3>
                    </div>
                    {resource.uploadedBy === user?._id && (
                      <button
                        onClick={() => handleDeleteResource(resource._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete resource"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          ></path>
                        </svg>
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-2 line-clamp-2">
                    {resource.description || "No description provided"}
                  </p>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-auto flex justify-between items-center">
                    <span>
                      Uploaded{" "}
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                    <span>By {resource.uploadedByName || "Unknown user"}</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {resource.resourceUrl && (
                      <a
                        href={resource.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex-1 text-center"
                      >
                        Open Link
                      </a>
                    )}
                    {resource.fileUrl && (
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex-1 text-center"
                      >
                        View File
                      </a>
                    )}
                    {resource.fileUrl && (
                      <a
                        href={resource.fileUrl}
                        download
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm flex-1 text-center"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No resources have been added to this class yet.
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Click "Upload Resource" to add the first resource!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;

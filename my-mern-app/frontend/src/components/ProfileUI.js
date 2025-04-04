import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const ProfileUI = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    college: '',
    position: '',
    grade: '',
    major: '',
    profileImage: '',
  });
  const [originalProfile, setOriginalProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileInput, setShowFileInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const defaultAvatar = '/images/225-default-avatar.png'; // Relative URL to the image in the public directory

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:5001/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Fetched user data:", data); // Debugging log
          setProfile(data);
          setOriginalProfile(data);
          setUser(data); // Set user data for header
        } else {
          setUser(null);
          navigate("/login"); // Redirect if not authenticated
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    console.log("isEditing state changed:", isEditing);
  }, [isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const validate = () => {
    const newErrors = {};
    // Remove required validation for now
    return newErrors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const userId = user?._id; // Get user ID from state

    if (!userId) {
      setMessage("User ID not found");
      return;
    }
  
    try {
      // If there's a file to upload, send it to the backend upload endpoint first
      let updatedProfile = {...profile}; // Create a copy of the current profile
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profilePicture', selectedFile);
        formData.append('userId', userId);
  
        const uploadRes = await axios.post(
          'http://localhost:5001/api/auth/upload-profile-picture',
          formData,
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
  
        // Get the profile picture URL from the response
        const imageUrl = uploadRes.data.profilePicture;
        
        // Update our local copy with the new image URL
        updatedProfile.profileImage = imageUrl;
      }
      
      // Now send the updated profile (with the new image URL if there was one)

      const response = await axios.put(
        `http://localhost:5001/api/auth/profile/${userId}`,
        updatedProfile,
        { withCredentials: true }
      );
  
      // Update both profile and originalProfile with the response data
      setMessage("Profile updated successfully!");
      setProfile(response.data.user);
      setOriginalProfile(response.data.user);
      
      setIsEditing(false);
      setShowFileInput(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setMessage(error.response?.data?.message || "Error updating profile");
    }
  };

  const handleCancel = () => {
    console.log("Cancel button clicked!"); // Debugging log
    setProfile(originalProfile); // Reset profile to original values
    setIsEditing(false);
    setMessage(''); // Clear the message
    setShowFileInput(false); // Hide file input on cancel
    setSelectedFile(null); // Reset file selection
    setShowDeleteConfirm(false); // Hide delete confirmation
  };

  const handleEdit = () => {
    console.log("Edit button clicked!"); // Debugging log
    setIsEditing(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleFeedbackForm = () => navigate('/feedback');

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleEditPicture = () => {
    setShowFileInput(true);
    setShowDeleteConfirm(false);
  };

  const handleDeletePicture = async () => {
    try {
      const userId = user?._id;
      if (!userId) {
        setMessage("User ID not found");
        return;
      }

      const response = await axios.delete(
        `http://localhost:5001/api/auth/delete-profile-picture/${userId}`,
        { withCredentials: true }
      );

      // Update profile with the response data
      setProfile(response.data.user);
      setOriginalProfile(response.data.user);
      setMessage("Profile picture deleted successfully");
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      setMessage(error.response?.data?.message || "Error deleting profile picture");
    }
  };

  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">BoileResources</span>
            </div>
            <div className="relative flex items-center gap-4">
              {user ? (
                <span className="text-white">Welcome, {user.username}!</span>
              ) : (
                <span className="text-white">Welcome, User!</span>
              )}
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
                      onClick={handleGoHome}
                      className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Home
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
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">Profile</h2>
          </div>
          {message && <p className="text-center text-green-500 dark:text-green-400">{message}</p>}
          <div className="flex">
            <div className="w-1/3 flex flex-col items-center">
              <div className="flex items-center justify-center mt-4">
                <img
                  src={profile.profileImage || defaultAvatar}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                />
              </div>
              <div className="mt-4">
                {showFileInput ? (
                  <>
                    <input
                      id="profileImage"
                      name="profileImage"
                      type="file"
                      onChange={handleFileChange}
                      className="mt-1 block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    />
                    <div className="flex justify-between mt-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white !bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ml-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : showDeleteConfirm ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Are you sure you want to delete your profile picture?
                    </p>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={handleDeletePicture}
                        className="group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ml-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <button
                      type="button"
                      onClick={handleEditPicture}
                      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white !bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Edit Picture
                    </button>
                    {profile.profileImage && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete Picture
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="w-2/3 pl-8"> {/* Added padding-left for spacing */}
              <form key={isEditing ? "editing" : "viewing"} className="mt-8 space-y-6" onSubmit={handleSave}>
                <div className="rounded-md shadow-sm space-y-4"> {/* Added space-y-4 for spacing between fields */}
                  <div className="flex items-center">
                    <label htmlFor="username" className="w-1/4">Username:</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={profile.username}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                      placeholder="Username"
                    />
                    {errors.username && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.username}</p>}
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="email" className="w-1/4">Email:</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={profile.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                      placeholder="Email"
                    />
                    {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="position" className="w-1/4">Position:</label>
                    <input
                      id="position"
                      name="position"
                      type="text"
                      value={profile.position}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                      placeholder="Position"
                    />
                    {errors.position && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.position}</p>}
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="grade" className="w-1/4">Grade:</label>
                    <input
                      id="grade"
                      name="grade"
                      type="text"
                      value={profile.grade}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                      placeholder="Grade"
                    />
                    {errors.grade && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.grade}</p>}
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="major" className="w-1/4">Major:</label>
                    <input
                      id="major"
                      name="major"
                      type="text"
                      value={profile.major}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                      placeholder="Major"
                    />
                    {errors.major && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.major}</p>}
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="college" className="w-1/4">College:</label>
                    <input
                      id="college"
                      name="college"
                      type="text"
                      value={profile.college}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                      placeholder="College"
                    />
                    {errors.college && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.college}</p>}
                  </div>
                </div>

                <div>
                  {isEditing ? (
                    <>
                      <button
                        type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white !bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-2"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white !bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUI;
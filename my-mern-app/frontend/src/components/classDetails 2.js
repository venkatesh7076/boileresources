import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!id) {
      setErrorMessage("Class ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchClassDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/courses/${id}`);
        if (!response.ok) {
          throw new Error("Class not found");
        }
        const data = await response.json();
        setClassDetails(data);
      } catch (err) {
        console.error("❌ Error fetching class details:", err);
        setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDetails();
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!classDetails || errorMessage) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{errorMessage || "Class not found."}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-yellow-700">
          {classDetails.courseCode}: {classDetails.title}
        </h1>
        <p className="mt-2 text-gray-700">{classDetails.description || "No description available."}</p>
        <p className="mt-2"><strong>Professor:</strong> {classDetails.professor || "Unknown"}</p>
<p className="mt-2"><strong>Credits:</strong> {classDetails.creditHours || "Unknown"}</p>
<p className="mt-2"><strong>Type:</strong> {classDetails.type || "Unknown"}</p>


        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ClassDetails;

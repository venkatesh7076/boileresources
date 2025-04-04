import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState(null);
  const [otherClasses, setOtherClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [professorOptions, setProfessorOptions] = useState(null);
  const professorOptionsRef = useRef(null);

  useEffect(() => {
    if (!id) {
      setErrorMessage("Class ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchClassDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/courses/${id}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Class not found");
        }
        const data = await response.json();
        setClassDetails(data);

        // Fetch other classes taught by any of the professors (limit 3)
        if (data.professor) {
          const professorNames = data.professor.split(",").map(name => name.trim());
          let allFoundClasses = []; // Store ALL found classes here

          for (const professorName of professorNames) {
            console.log(`Fetching classes for professor: "${professorName}"`);
            
            try {
              const otherClassesResponse = await fetch(`${API_URL}/api/courses/professor/${encodeURIComponent(professorName)}`, {
                credentials: "include",
              });
              
              if (otherClassesResponse.ok) {
                const otherClassesData = await otherClassesResponse.json();
                console.log(`Found ${otherClassesData.length} classes for ${professorName}`);
                
                // Filter out the current class
                const newClasses = otherClassesData.filter(course => course._id !== id);
                console.log(`After filtering current class, found ${newClasses.length} other classes`);
                
                // Add to our collection of all found classes
                allFoundClasses = [...allFoundClasses, ...newClasses];
              } else {
                console.error(`Error fetching classes for professor "${professorName}":`, otherClassesResponse.statusText);
              }
            } catch (err) {
              console.error(`Exception while fetching classes for "${professorName}":`, err);
            }
          }

          // Remove duplicates (in case a course has multiple professors from our list)
          const uniqueClasses = allFoundClasses.filter((course, index, self) =>
            index === self.findIndex((c) => c._id === course._id)
          );
          
          // Limit to 3 classes
          const limitedClasses = uniqueClasses.slice(0, 3);
          console.log(`Final display: ${limitedClasses.length} classes`);
          
          setOtherClasses(limitedClasses);
        }
      } catch (err) {
        console.error("❌ Error fetching class details:", err);
        setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDetails();
  }, [id]);

  const handleRedditSearch = () => {
    const searchQuery = `${classDetails.courseCode} ${classDetails.title}`;
    const redditUrl = `https://www.reddit.com/r/Purdue/search?q=${encodeURIComponent(searchQuery)}&restrict_sr=1`;
    window.open(redditUrl, "_blank");
  };

  const handleRateMyProfessorSearch = () => {
    if (!classDetails?.professor) {
      alert("No professor listed for this class.");
      return;
    }
  
    const professorNames = classDetails.professor
      .split(",")
      .map(name => name.trim())
      .filter(name => name && name.toLowerCase() !== "staff");
  
    // Hardcoded map of professor name to RMP ID
    const knownProfessors = {
      "Sarah H Sellke": "1734941",
      "Wojciech Szpankowski": "132647"
      // Add more here later if needed
    };
  
    if (professorNames.length === 1) {
      const name = professorNames[0];
      const encodedName = encodeURIComponent(name);
  
      const url = knownProfessors[name]
        ? `https://www.ratemyprofessors.com/professor/${knownProfessors[name]}`
        : `https://www.ratemyprofessors.com/search/professors/783?q=${encodedName}`;
  
      window.open(url, "_blank");
    } else {
      // Show options if more than one professor
      const options = professorNames.map((name, index) => {
        const encodedName = encodeURIComponent(name);
        const url = knownProfessors[name]
          ? `https://www.ratemyprofessors.com/professor/${knownProfessors[name]}`
          : `https://www.ratemyprofessors.com/search/professors/783?q=${encodedName}`;
  
        return (
          <button
            key={index}
            onClick={() => {
              window.open(url, "_blank");
              setProfessorOptions(null);
            }}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            {name}
          </button>
        );
      });
  
      setProfessorOptions(options);
    }
  };

  // const handleRateMyProfessorSearch = () => {
  //   const professorNames = classDetails.professor.split(",").map(name => name.trim());
  //   if (professorNames.length === 1) {
  //     const searchQuery = professorNames[0];
  //     const rateMyProfessorUrl = `https://www.ratemyprofessors.com/search/professors/783?q=${encodeURIComponent(searchQuery)}`;
  //     window.open(rateMyProfessorUrl, "_blank");
  //   } else {
  //     const professorOptions = professorNames.map((name, index) => (
  //       <button
  //         key={index}
  //         onClick={() => {
  //           const searchQuery = name;
  //           const rateMyProfessorUrl = `https://www.ratemyprofessors.com/search/professors/783?q=${encodeURIComponent(searchQuery)}`;
  //           window.open(rateMyProfessorUrl, "_blank");
  //           setProfessorOptions(null); // Close the options after clicking
  //         }}
  //         className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
  //       >
  //         {name}
  //       </button>
  //     ));
  //     setProfessorOptions(professorOptions);
  //   }
  // };

  // Close professor options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (professorOptionsRef.current && !professorOptionsRef.current.contains(event.target)) {
        setProfessorOptions(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

        {otherClasses.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800">Other classes taught by these professors:</h2>
            <ul className="list-disc list-inside mt-2">
              {otherClasses.map(course => (
                <li key={course._id} className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/class/${course._id}`)}>
                  {course.courseCode}: {course.title}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-gray-500">No other classes found for these professors.</p>
        )}

        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Back
        </button>

        <button
          onClick={handleRedditSearch}
          className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Find on Reddit
        </button>

        <button
          onClick={handleRateMyProfessorSearch}
          className="mt-4 ml-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
        >
          RateMyProfessor
        </button>

        {professorOptions && (
          <div ref={professorOptionsRef} className="mt-4">
            <h2 className="text-xl font-semibold text-gray-800">Select a professor:</h2>
            <div className="flex flex-col mt-2">
              {professorOptions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetails;
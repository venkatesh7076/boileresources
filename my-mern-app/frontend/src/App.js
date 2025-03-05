import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import ProfileUI from "./components/ProfileUI";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";
import Home from "./components/Home";
import AddClass from "./components/AddClass";
import DeleteClass from "./components/DeleteClass";
import ClassDetails from "./components/classDetails"; // ✅ Ensure it's correctly imported

const OAuthHandler = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/home"); // ✅ Redirect to home after login
    }
  }, [navigate]);

  return <div>Redirecting...</div>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:id/:token" element={<VerifyEmail />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<ProfileUI />} />
        <Route path="/add-class" element={<AddClass />} />
        <Route path="/delete-class" element={<DeleteClass />} />
        <Route path="/class/:id" element={<ClassDetails />} /> {/* ✅ Fixed Route */}
        <Route path="/oauth-callback" element={<OAuthHandler />} />
      </Routes>
    </Router>
  );
}

export default App;

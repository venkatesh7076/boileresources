import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import ProfileUI from './components/ProfileUI';
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ForgotPassword from "./components/ForgotPassword";
import Home from "./components/Home"; 

const OAuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Capture the token from the URL after Google login
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Store the token in localStorage
      localStorage.setItem("token", token);

      // ✅ Redirect to /dashboard instead of home for clarity - FIX THIS COMMENT
      navigate("/home");
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
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<ProfileUI />} />
        <Route path="/oauth-callback" element={<OAuthHandler />} /> 
        {/* ✅ OAuth handler properly captures tokens */}
      </Routes>
    </Router>
  );
}

export default App;
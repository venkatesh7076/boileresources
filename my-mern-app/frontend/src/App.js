import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from './context/ThemeContext';

import ProfileUI from './components/ProfileUI';
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";
import Home from "./components/Home";
import AddClass from "./components/AddClass";
import DeleteClass from "./components/DeleteClass";
import DeleteCompletedClass from "./components/DeleteCompletedClass";
import ClassDetails from "./components/classDetails";
import Chat from "./components/Chat";
import ScheduleCalendar from "./components/setCalendar"; // ✅ NEW
import FeedbackForm from "./components/FeedbackForm"; // ✅ Ensure it's correctly imported

const OAuthHandler = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/home");
    }
  }, [navigate]);
  return <div>Redirecting...</div>;
};

function App() {
  return (
    <ThemeProvider>
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
          <Route path="/delete-completed-class" element={<DeleteCompletedClass />} />

          {/* ✅ Chat + Calendar Routes */}
          <Route path="/chat/:groupId" element={<Chat userId="650a4f2e9b5c7c001a2f3d89" />} />
          <Route path="/calendar" element={<ScheduleCalendar />} /> {/* ✅ New route */}
          <Route path="/feedback" element={<FeedbackForm />} /> {/* ✅ Feedback form route */}
          <Route path="/class/:id" element={<ClassDetails />} /> {/* ✅ Fixed Route */}
          <Route path="/oauth-callback" element={<OAuthHandler />} /> {/* ✅ OAuth handler properly captures tokens */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

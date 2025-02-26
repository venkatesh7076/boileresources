import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "tw-elements";
import { FcGoogle } from "react-icons/fc";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState({ email: "", password: "", general: "" });
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      setIsAuthenticated(true);
      navigate("/home");
    }
  }, [navigate]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let validationErrors = { email: "", password: "", general: "" };

    if (!email) {
      validationErrors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      validationErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      validationErrors.password = "Password is required.";
    }

    if (validationErrors.email || validationErrors.password) {
      setError(validationErrors);
      return;
    }

    setError({ email: "", password: "", general: "" });

    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }
        setIsAuthenticated(true);
        navigate("/home");
      } else {
        setError({ ...error, general: data.message || "Login failed" });
      }
    } catch (err) {
      setError({ ...error, general: "Connection error. Please try again." });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5001/api/auth/google";
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5001/api/auth/logout", {
        method: "GET",
        credentials: "include",
      });

      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleGoToSignUp = () => {
    navigate("/");
  };

  return (
    <div
      className="h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/background.jpg')" }}
    >
      <div className="w-full bg-yellow-700 py-4 text-center text-white text-xl font-bold">
        BoileResources
      </div>

      <div className="flex justify-center items-center h-full">
        {isAuthenticated ? (
          <div className="flex flex-col items-center">
            <p className="mb-4 text-lg">You are logged in!</p>
            <button
              onClick={handleLogout}
              className="text-white py-2 px-6 rounded-lg bg-red-500 hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md w-96 bg-opacity-90 backdrop-blur-lg"
          >
            <h2 className="text-xl font-bold text-center mb-4">Login</h2>

            {error.general && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {error.general}
              </div>
            )}

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${
                  error.email ? "border-red-500" : "border-gray-300"
                } rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500`}
              />
              {error.email && (
                <p className="text-red-500 text-xs mt-1">{error.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${
                  error.password ? "border-red-500" : "border-gray-300"
                } rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500`}
              />
              {error.password && (
                <p className="text-red-500 text-xs mt-1">{error.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                  Remember Me
                </label>
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full text-white py-2 rounded-lg transition
                      bg-gradient-to-r from-black to-yellow-500
                      hover:from-gray-800 hover:to-yellow-400"
            >
              Login
            </button>

            {/* Google OAuth Button */}
            <div className="relative mt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center py-2 border border-gray-300 rounded-lg
                        shadow-sm bg-white text-gray-700 hover:bg-gray-100 transition"
              >
                <FcGoogle className="text-xl mr-2" /> Sign in with Google
              </button>
            </div>

            {/* Back to Sign Up Button */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleGoToSignUp}
                className="text-sm text-blue-600 hover:underline focus:outline-none"
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginForm;

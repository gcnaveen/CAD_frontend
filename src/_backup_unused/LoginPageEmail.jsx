/* eslint-disable no-unused-vars */
// Backup: staff email login page - not in App routes (main LoginPage supports email + phone)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffLogin } from "../services/auth/authService.js";
import { TOKEN_KEY, USER_KEY } from "../config/axiosInstance.js";

const LoginPageEmail = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return /^\d{4}$/.test(password || "");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be exactly 4 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRedirectForRole = (role) => {
    const r = (role || "").toUpperCase();
    if (r === "SUPER_ADMIN") return "/superadmin";
    if (r === "CAD" || r === "CAD_USER") return "/dashboard/cad";
    if (r === "ADMIN") return "/superadmin";
    return "/superadmin";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const data = await staffLogin({
        email: formData.email,
        password: formData.password,
      });
      if (data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      const userPayload = data?.user ?? data;
      if (userPayload != null) {
        localStorage.setItem(USER_KEY, JSON.stringify(userPayload));
      }
      const role = userPayload?.role ?? data?.role;
      const redirectTo = getRedirectForRole(role);
      setErrors({});
      setTimeout(() => navigate(redirectTo, { replace: true }), 300);
    } catch (error) {
      setErrors({
        submit: error?.message ?? "Invalid email or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/assets/logo.png"
            alt="Logo"
            className="h-34 sm:h-26 w-auto mx-auto mb-6 object-contain"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Sign in with your email address
          </p>
        </div>
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3.5 bg-zinc-800 border ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                    : "border-zinc-700 focus:border-cyan-500 focus:ring-cyan-500/50"
                } rounded-xl text-white placeholder-gray-500 outline-none focus:ring-1 transition-all text-base`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setFormData((prev) => ({ ...prev, password: value }));
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                  placeholder="Enter 4-digit password"
                  className={`w-full px-4 py-3.5 pr-12 bg-zinc-800 border ${
                    errors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : "border-zinc-700 focus:border-cyan-500 focus:ring-cyan-500/50"
                  } rounded-xl text-white placeholder-gray-500 outline-none focus:ring-1 transition-all text-base`}
                  inputMode="numeric"
                  maxLength={4}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                  {errors.password}
                </p>
              )}
            </div>
            {errors.submit && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400">{errors.submit}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">
          Protected by industry-standard encryption
        </p>
      </div>
    </div>
  );
};

export default LoginPageEmail;

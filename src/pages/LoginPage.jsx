import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import { userLogin } from "../services/user/userService";

const getRedirectForRole = (role) => {
  const r = (role || "").toUpperCase();
  if (r === "SUPER_ADMIN") return "/superadmin";
  if (r === "ADMIN") return "/superadmin";
  if (r === "CAD" || r === "CAD_USER") return "/dashboard/cad";
  if (r === "SURVEYOR") return "/dashboard/user";
  if (r === "USER" || r === "CUSTOMER") return "/dashboard/user";
  return "/";
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const LoginPage = () => {
  const [loginMode, setLoginMode] = useState("phone"); // "phone" | "email"
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setErrors({});

    if (loginMode === "email") {
      if (!email.trim()) {
        setErrors((prev) => ({ ...prev, email: "Email is required" }));
        return;
      }
      if (!validateEmail(email)) {
        setErrors((prev) => ({ ...prev, email: "Please enter a valid email" }));
        return;
      }
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    setIsLoading(true);
    try {
      const payload =
        loginMode === "phone"
          ? { phone: phone.replace(/\D/g, "").slice(0, 10), password }
          : { email: email.trim(), password };
      const response = await userLogin(payload);
      // API returns { success, data: { user, token, ... } }; axios response.data is that body
      const body = response?.data ?? response;
      const data = body?.data ?? body;

      const token = data?.token ?? body?.token;
      const userPayload = data?.user ?? data;
      const user = userPayload ?? (data?.name != null || data?.email != null ? data : null);
      dispatch(setCredentials({ token, user }));

      const role = user?.role ?? data?.role ?? body?.role;
      const redirectTo = getRedirectForRole(role);
      setMessage({ type: "success", text: "Login successful. Redirecting..." });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.message ?? "Login failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setLoginMode((m) => (m === "phone" ? "email" : "phone"));
    setMessage({ type: "", text: "" });
    setErrors({});
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
            {loginMode === "phone"
              ? "Sign in with your phone number and password"
              : "Sign in with your email and password"}
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            {loginMode === "phone" ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="flex rounded-xl overflow-hidden border border-zinc-700 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
                  <span className="flex items-center px-4 bg-zinc-800 text-gray-400 text-sm border-r border-zinc-700">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="98765 43210"
                    className="w-full px-4 py-3.5 bg-transparent text-white placeholder-gray-500 outline-none text-base"
                    required={loginMode === "phone"}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3.5 bg-transparent text-white placeholder-gray-500 outline-none text-base rounded-xl border transition-all ${
                    errors.email
                      ? "border-red-500"
                      : "border-zinc-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                  }`}
                  required={loginMode === "email"}
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3.5 pr-12 bg-transparent text-white placeholder-gray-500 outline-none text-base rounded-xl border transition-all ${
                    errors.password
                      ? "border-red-500"
                      : "border-zinc-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <button
              type="button"
              onClick={switchMode}
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors w-full text-center"
            >
              {loginMode === "phone"
                ? "Sign in with email instead"
                : "Sign in with phone number instead"}
            </button>

            {message.text && (
              <div
                className={`p-3 rounded-lg border ${
                  message.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                    : "bg-red-500/10 border-red-500/50 text-red-400"
                } text-sm`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>

            <p className="text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Register here
              </a>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Protected by industry-standard encryption
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

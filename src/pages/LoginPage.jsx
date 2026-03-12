// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { setCredentials } from "../features/auth/authSlice";
// import { userLogin } from "../services/user/userService";

// const getRedirectForRole = (role) => {
//   const r = (role || "").toUpperCase();
//   if (r === "SUPER_ADMIN") return "/superadmin";
//   if (r === "ADMIN") return "/superadmin";
//   if (r === "CAD" || r === "CAD_USER") return "/dashboard/cad";
//   if (r === "SURVEYOR") return "/dashboard/user";
//   if (r === "USER" || r === "CUSTOMER") return "/dashboard/user";
//   return "/";
// };

// const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// const LoginPage = () => {
//   const [loginMode, setLoginMode] = useState("phone"); // "phone" | "email"
//   const [phone, setPhone] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [message, setMessage] = useState({ type: "", text: "" });
//   const [errors, setErrors] = useState({});
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setMessage({ type: "", text: "" });
//     setErrors({});

//     if (loginMode === "email") {
//       if (!email.trim()) {
//         setErrors((prev) => ({ ...prev, email: "Email is required" }));
//         return;
//       }
//       if (!validateEmail(email)) {
//         setErrors((prev) => ({ ...prev, email: "Please enter a valid email" }));
//         return;
//       }
//     }
//     if (!password) {
//       setErrors((prev) => ({ ...prev, password: "Password is required" }));
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const payload =
//         loginMode === "phone"
//           ? { phone: phone.replace(/\D/g, "").slice(0, 10), password }
//           : { email: email.trim(), password };
//       const response = await userLogin(payload);
//       // API returns { success, data: { user, token, ... } }; axios response.data is that body
//       const body = response?.data ?? response;
//       const data = body?.data ?? body;

//       const token = data?.token ?? body?.token;
//       const userPayload = data?.user ?? data;
//       const user = userPayload ?? (data?.name != null || data?.email != null ? data : null);
//       dispatch(setCredentials({ token, user }));

//       const role = user?.role ?? data?.role ?? body?.role;
//       const redirectTo = getRedirectForRole(role);
//       setMessage({ type: "success", text: "Login successful. Redirecting..." });
//       navigate(redirectTo, { replace: true });
//     } catch (err) {
//       setMessage({
//         type: "error",
//         text: err?.message ?? "Login failed. Please try again.",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const switchMode = () => {
//     setLoginMode((m) => (m === "phone" ? "email" : "phone"));
//     setMessage({ type: "", text: "" });
//     setErrors({});
//   };

//   return (
//     <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
//       <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
//       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

//       <div className="relative w-full max-w-md">
//         <div className="text-center mb-8">
//           <img
//             src="/assets/logo.png"
//             alt="Logo"
//             className="h-34 sm:h-26 w-auto mx-auto mb-6 object-contain"
//           />
//           <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
//             Welcome Back
//           </h1>
//           <p className="text-gray-400 text-sm sm:text-base">
//             {loginMode === "phone"
//               ? "Sign in with your phone number and password"
//               : "Sign in with your email and password"}
//           </p>
//         </div>

//         <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
//           <form onSubmit={handleLogin} className="space-y-6">
//             {loginMode === "phone" ? (
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Phone Number
//                 </label>
//                 <div className="flex rounded-xl overflow-hidden border border-zinc-700 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
//                   <span className="flex items-center px-4 bg-zinc-800 text-gray-400 text-sm border-r border-zinc-700">
//                     +91
//                   </span>
//                   <input
//                     type="tel"
//                     value={phone}
//                     onChange={(e) =>
//                       setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
//                     }
//                     placeholder="98765 43210"
//                     className="w-full px-4 py-3.5 bg-transparent text-white placeholder-gray-500 outline-none text-base"
//                     required={loginMode === "phone"}
//                   />
//                 </div>
//               </div>
//             ) : (
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Email Address
//                 </label>
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="you@example.com"
//                   className={`w-full px-4 py-3.5 bg-transparent text-white placeholder-gray-500 outline-none text-base rounded-xl border transition-all ${
//                     errors.email
//                       ? "border-red-500"
//                       : "border-zinc-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
//                   }`}
//                   required={loginMode === "email"}
//                 />
//                 {errors.email && (
//                   <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
//                 )}
//               </div>
//             )}

//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Enter your password"
//                   className={`w-full px-4 py-3.5 pr-12 bg-transparent text-white placeholder-gray-500 outline-none text-base rounded-xl border transition-all ${
//                     errors.password
//                       ? "border-red-500"
//                       : "border-zinc-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
//                   }`}
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((p) => !p)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1"
//                   tabIndex={-1}
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                   {showPassword ? (
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                     </svg>
//                   ) : (
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//               {errors.password && (
//                 <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
//               )}
//             </div>

//             <button
//               type="button"
//               onClick={switchMode}
//               className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors w-full text-center"
//             >
//               {loginMode === "phone"
//                 ? "Sign in with email instead"
//                 : "Sign in with phone number instead"}
//             </button>

//             {message.text && (
//               <div
//                 className={`p-3 rounded-lg border ${
//                   message.type === "success"
//                     ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
//                     : "bg-red-500/10 border-red-500/50 text-red-400"
//                 } text-sm`}
//               >
//                 {message.text}
//               </div>
//             )}

//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
//             >
//               {isLoading ? "Signing in..." : "Login"}
//             </button>

//             <p className="text-center text-sm text-gray-400">
//               Don't have an account?{" "}
//               <a
//                 href="/register"
//                 className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
//               >
//                 Register here
//               </a>
//             </p>
//           </form>
//         </div>

//         <p className="text-center text-xs text-gray-500 mt-6">
//           Protected by industry-standard encryption
//         </p>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import { userLogin } from "../services/user/userService";
import { Eye, EyeOff, ArrowRight, Phone, Mail, MapPin, Shield } from "lucide-react";

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

// Surveying crosshair marker SVG
const Crosshair = ({ size = 20, opacity = 0.18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" style={{ opacity }}>
    <line x1="10" y1="0" x2="10" y2="7" />
    <line x1="10" y1="13" x2="10" y2="20" />
    <line x1="0" y1="10" x2="7" y2="10" />
    <line x1="13" y1="10" x2="20" y2="10" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setErrors({});
    if (loginMode === "email") {
      if (!email.trim()) { setErrors({ email: "Email is required" }); return; }
      if (!validateEmail(email)) { setErrors({ email: "Please enter a valid email" }); return; }
    }
    if (!password) { setErrors({ password: "Password is required" }); return; }
    setIsLoading(true);
    try {
      const payload = loginMode === "phone"
        ? { phone: phone.replace(/\D/g, "").slice(0, 10), password }
        : { email: email.trim(), password };
      const response = await userLogin(payload);
      const body = response?.data ?? response;
      const data = body?.data ?? body;
      const token = data?.token ?? body?.token;
      const userPayload = data?.user ?? data;
      const user = userPayload ?? (data?.name != null || data?.email != null ? data : null);
      dispatch(setCredentials({ token, user }));
      const role = user?.role ?? data?.role ?? body?.role;
      setMessage({ type: "success", text: "Login successful. Redirecting…" });
      navigate(getRedirectForRole(role), { replace: true });
    } catch (err) {
      setMessage({ type: "error", text: err?.message ?? "Login failed. Please try again." });
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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f7f2e8 0%, #f0ead8 35%, #e8dfc8 65%, #ddd4b8 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "clamp(16px, 4vw, 32px)",
      position: "relative", overflow: "hidden",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        @keyframes ping { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logo-in {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-input {
          width: 100%;
          background: rgba(255,255,255,0.6);
          border: 1.5px solid rgba(213,200,178,0.8);
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 14.5px;
          color: #1a1a0a;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-sizing: border-box;
          backdrop-filter: blur(4px);
        }
        .lp-input::placeholder { color: rgba(100,90,70,0.45); }
        .lp-input:focus {
          border-color: rgba(201,168,76,0.7);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
          background: rgba(255,255,255,0.85);
        }
        .lp-input.error {
          border-color: rgba(220,80,60,0.6);
          box-shadow: 0 0 0 3px rgba(220,80,60,0.08);
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 13px;
          background: linear-gradient(135deg, #152815 0%, #1d3d1d 100%);
          color: white;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.04em;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 28px rgba(21,40,21,0.30);
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(201,168,76,0.08) 100%);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d3d1d 0%, #2a5a2a 100%);
          box-shadow: 0 12px 36px rgba(21,40,21,0.38);
          transform: translateY(-1px);
        }
        .submit-btn:hover::before { opacity: 1; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .mode-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #9a7020;
          transition: color 0.2s ease;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.01em;
        }
        .mode-toggle-btn:hover { color: #c9a84c; }
        .coord-label {
          font-family: monospace;
          font-size: 10px;
          color: rgba(154,112,32,0.35);
          letter-spacing: 0.1em;
          position: absolute;
          pointer-events: none;
          user-select: none;
        }
      `}</style>

      {/* ── BACKGROUND DECORATIONS ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
        {/* Large ambient orbs */}
        <div style={{
          position: "absolute", top: "-120px", left: "-100px",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.13) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-80px", right: "-80px",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(21,40,21,0.08) 0%, transparent 65%)",
        }} />

        {/* Survey grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.055) 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
        }} />

        {/* Corner crosshairs */}
        <div style={{ position: "absolute", top: "28px", left: "28px" }}><Crosshair size={22} opacity={0.22} /></div>
        <div style={{ position: "absolute", top: "28px", right: "28px" }}><Crosshair size={22} opacity={0.22} /></div>
        <div style={{ position: "absolute", bottom: "28px", left: "28px" }}><Crosshair size={22} opacity={0.22} /></div>
        <div style={{ position: "absolute", bottom: "28px", right: "28px" }}><Crosshair size={22} opacity={0.22} /></div>

        {/* Coordinate labels — surveying feel */}
        <span className="coord-label" style={{ top: "18px", left: "56px" }}>12.97°N 77.59°E</span>
        <span className="coord-label" style={{ top: "18px", right: "56px" }}>KARNATAKA · INDIA</span>
        <span className="coord-label" style={{ bottom: "18px", left: "56px" }}>NORTH-COT · PLATFORM</span>
        <span className="coord-label" style={{ bottom: "18px", right: "56px" }}>SURVEY · CAD · QC</span>

        {/* Floating extra crosshairs */}
        {[
          { top: "18%", left: "8%", size: 16, op: 0.12 },
          { top: "60%", left: "5%", size: 14, op: 0.10 },
          { top: "30%", right: "7%", size: 16, op: 0.12 },
          { top: "70%", right: "6%", size: 14, op: 0.10 },
          { top: "45%", left: "14%", size: 12, op: 0.09 },
          { top: "45%", right: "14%", size: 12, op: 0.09 },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos }}>
            <Crosshair size={pos.size} opacity={pos.op} />
          </div>
        ))}

        {/* Dashed horizontal guide lines */}
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.12) 20%, rgba(201,168,76,0.12) 80%, transparent 100%)",
        }} />
      </div>

      {/* ── MAIN CARD ── */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: "440px",
        animation: mounted ? "card-in 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
        opacity: mounted ? undefined : 0,
      }}>

        {/* ── LOGO AREA ── */}
        <div style={{
          textAlign: "center", marginBottom: "28px",
          animation: mounted ? "logo-in 0.6s ease 0.1s both" : "none",
        }}>
          {/* Logo container with pulsing ring */}
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            position: "relative", marginBottom: "14px",
          }}>
            {/* Outer pulse ring */}
            <div style={{
              position: "absolute", inset: "-10px", borderRadius: "50%",
              border: "1px solid rgba(201,168,76,0.3)",
              animation: "ping 2.5s ease-out infinite",
            }} />
            {/* Inner ring */}
            <div style={{
              position: "absolute", inset: "-4px", borderRadius: "50%",
              border: "1.5px solid rgba(201,168,76,0.25)",
            }} />
            {/* Logo image */}
            <div style={{
              width: "110px", height: "110px", borderRadius: "50%",
              background: "#000",
              backdropFilter: "blur(8px)",
              border: "2px solid rgba(201,168,76,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 28px rgba(201,168,76,0.18), 0 2px 8px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}>
              <img
                src="/assets/logo.png"
                alt="North-cot"
                style={{ width: "80px", height: "80px", objectFit: "contain" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `
                    <span style="font-family:'IBM Plex Serif',Georgia,serif;font-style:italic;font-weight:700;font-size:22px;color:#c9a84c;">NC</span>
                  `;
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ height: "1px", width: "32px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5))" }} />
            <span style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontStyle: "italic", fontWeight: 700,
              fontSize: "28px", color: "#0d1f0d", letterSpacing: "0.02em",
            }}>
              North-cot
            </span>
            <div style={{ height: "1px", width: "50px", background: "linear-gradient(90deg, rgba(201,168,76,0.5), transparent)" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <MapPin size={10} color="#9a7020" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#9a7020", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Land Survey & Revenue Documentation
            </span>
          </div>
        </div>

        {/* ── FORM CARD ── */}
        <div style={{
          background: "rgba(255,255,255,0.68)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(232,226,216,0.9)",
          borderRadius: "24px",
          padding: "clamp(24px, 5vw, 36px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(201,168,76,0.10), 0 0 0 1px rgba(201,168,76,0.08)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Gold top accent */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            background: "linear-gradient(90deg, transparent, #c9a84c 30%, #c9a84c 70%, transparent)",
          }} />

          {/* Card header */}
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontStyle: "italic", fontWeight: 600,
              fontSize: "clamp(20px, 3vw, 26px)", color: "#0d1f0d",
              lineHeight: 1.2, marginBottom: "6px",
            }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: "13px", color: "#8a7a60", lineHeight: 1.5 }}>
              {loginMode === "phone"
                ? "Sign in with your phone number and password"
                : "Sign in with your email and password"}
            </p>
          </div>

          {/* Mode tab toggle */}
          <div style={{
            display: "flex",
            background: "rgba(232,226,216,0.5)",
            borderRadius: "11px",
            padding: "3px",
            marginBottom: "22px",
            gap: "2px",
          }}>
            {[
              { mode: "phone", label: "Phone", icon: <Phone size={13} /> },
              { mode: "email", label: "Email", icon: <Mail size={13} /> },
            ].map(({ mode, label, icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setLoginMode(mode); setMessage({ type: "", text: "" }); setErrors({}); }}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "9px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontSize: "13px", fontWeight: 600, letterSpacing: "0.02em",
                  transition: "all 0.2s ease",
                  background: loginMode === mode ? "white" : "transparent",
                  color: loginMode === mode ? "#0d1f0d" : "rgba(100,90,70,0.55)",
                  boxShadow: loginMode === mode ? "0 1px 6px rgba(0,0,0,0.09)" : "none",
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Phone or Email */}
              {loginMode === "phone" ? (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b5a3a", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
                    Phone Number
                  </label>
                  <div style={{ display: "flex", gap: 0, borderRadius: "12px", overflow: "hidden", border: "1.5px solid rgba(213,200,178,0.8)", background: "rgba(255,255,255,0.6)", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    onFocusCapture={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.12)"; }}
                    onBlurCapture={e => { e.currentTarget.style.borderColor = "rgba(213,200,178,0.8)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <span style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 14px", fontSize: "14px", fontWeight: 700,
                      color: "#9a7020", background: "rgba(201,168,76,0.08)",
                      borderRight: "1.5px solid rgba(213,200,178,0.7)",
                      minWidth: "54px", flexShrink: 0,
                    }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      style={{
                        flex: 1, background: "transparent", border: "none", outline: "none",
                        padding: "13px 14px", fontSize: "14.5px", color: "#1a1a0a",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b5a3a", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`lp-input${errors.email ? " error" : ""}`}
                  />
                  {errors.email && <p style={{ fontSize: "12px", color: "#c0392b", marginTop: "5px" }}>{errors.email}</p>}
                </div>
              )}

              {/* Password */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b5a3a", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`lp-input${errors.password ? " error" : ""}`}
                    style={{ paddingRight: "46px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(100,90,70,0.5)", padding: "4px",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#9a7020"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(100,90,70,0.5)"; }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: "12px", color: "#c0392b", marginTop: "5px" }}>{errors.password}</p>}
              </div>

              {/* Message */}
              {message.text && (
                <div style={{
                  padding: "11px 14px", borderRadius: "10px",
                  background: message.type === "success" ? "rgba(42,110,42,0.08)" : "rgba(192,57,43,0.08)",
                  border: `1px solid ${message.type === "success" ? "rgba(42,110,42,0.25)" : "rgba(192,57,43,0.25)"}`,
                  fontSize: "13px", fontWeight: 500,
                  color: message.type === "success" ? "#1a5a1a" : "#9b2a1a",
                }}>
                  {message.text}
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(213,200,178,0.6)" }} />
                <span style={{ fontSize: "11px", color: "rgba(100,90,70,0.5)", fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(213,200,178,0.6)" }} />
              </div>

              {/* Switch mode */}
              <div style={{ textAlign: "center" }}>
                <button type="button" onClick={switchMode} className="mode-toggle-btn">
                  {loginMode === "phone" ? (
                    <><Mail size={12} /> Sign in with email instead</>
                  ) : (
                    <><Phone size={12} /> Sign in with phone instead</>
                  )}
                </button>
              </div>

              {/* Register */}
              <p style={{ textAlign: "center", fontSize: "13px", color: "#8a7a60", margin: 0 }}>
                Don't have an account?{" "}
                <a href="/register" style={{
                  color: "#9a7020", fontWeight: 700, textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#c9a84c"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#9a7020"; }}
                >
                  Register here
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Bottom trust badge */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          marginTop: "20px",
        }}>
          <Shield size={12} color="rgba(154,112,32,0.5)" />
          <span style={{ fontSize: "11px", color: "rgba(154,112,32,0.5)", fontWeight: 500, letterSpacing: "0.04em" }}>
            Protected by industry-standard encryption
          </span>
        </div>
      </div>

      {/* Spin keyframe for loader */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
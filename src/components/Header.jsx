import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TOKEN_KEY, USER_KEY } from "../config/axiosInstance.js";

const getDisplayName = (user) => {
  if (!user) return "User";
  if (typeof user.name === "string") return user.name;
  if (user.name && typeof user.name === "object") {
    const first = user.name.first ?? "";
    const last = user.name.last ?? "";
    return [first, last].filter(Boolean).join(" ") || user.auth?.email || user.email || "User";
  }
  return user.auth?.email || user.email || "User";
};

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsMobileMenuOpen(false);
    navigate("/login", { replace: true });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-20 lg:h-24">
          {/* Logo */}
          <div className="shrink-0">
            <img
              src="/assets/logoblack.png"
              alt="Logo"
              className="h-20 sm:h-24 md:h-24 lg:h-26 w-auto cursor-pointer transition-all duration-200"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-700 hover:text-gray-900 font-montserrat font-medium transition-colors duration-200 text-sm lg:text-base cursor-pointer"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="text-gray-700 hover:text-gray-900 font-montserrat font-medium transition-colors duration-200 text-sm lg:text-base cursor-pointer"
            >
              Benefits
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-gray-700 hover:text-gray-900 font-montserrat font-medium transition-colors duration-200 text-sm lg:text-base cursor-pointer"
            >
              Testimonials
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-700 text-sm font-medium">
                  {getDisplayName(user)}
                  {user.role && (
                    <span className="ml-1.5 text-gray-500 font-normal">
                      ({user.role})
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 lg:px-6 py-2 rounded-md font-montserrat font-semibold transition-all duration-200 text-sm lg:text-base cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/login");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 lg:px-6 py-2 rounded-md font-montserrat font-semibold transition-all duration-200 text-sm lg:text-base cursor-pointer"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div
            className={`py-4 space-y-4 ${
              isScrolled
                ? "bg-white/80 backdrop-blur-md"
                : "bg-white/90 backdrop-blur-md"
            } rounded-lg mt-2 mx-4`}
          >
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-md font-montserrat font-medium transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-md font-montserrat font-medium transition-colors cursor-pointer"
            >
              Benefits
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-md font-montserrat font-medium transition-colors cursor-pointer"
            >
              Testimonials
            </button>
            <div className="border-t border-gray-200 pt-4 mt-4">
              {user ? (
                <>
                  <p className="px-4 py-2 text-sm text-gray-600">
                    {getDisplayName(user)}
                    {user.role && (
                      <span className="block text-gray-500 text-xs">
                        {user.role}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-montserrat font-semibold transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="block w-full text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-montserrat font-semibold transition-colors cursor-pointer"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

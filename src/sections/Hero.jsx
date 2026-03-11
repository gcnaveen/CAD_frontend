// import React from "react";

// const Hero = () => {
//   const scrollToSection = (sectionId) => {
//     const element = document.getElementById(sectionId);
//     if (element) {
//       element.scrollIntoView({ behavior: "smooth" });
//     }
//   };

//   return (
//     <section className="min-h-screen flex items-center pt-20 md:pt-24 lg:pt-28 pb-12 md:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 bg-white">
//       <div className="container mx-auto">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
//           {/* Left Section - Text Content */}
//           <div className="order-2 lg:order-1 space-y-6 md:space-y-8">
//             {/* Main Heading */}
//             <h1 className="font-ibm text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
//               Convert Your Hand Sketch into Ready CAD Design
//             </h1>

//             {/* Description */}
//             <p className="font-montserrat text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
//               Stop getting your sketches rejected at government offices. Upload your hand-drawn sketch and receive a professional, accurate CAD drawing prepared by expert designers—all from the comfort of your home.
//             </p>

//             {/* Call to Action Buttons */}
//             <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 pt-2">
//               <button
//                 onClick={() => scrollToSection("upload")}
//                 className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-montserrat font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
//               >
//                 <span>Upload Your Sketch</span>
//                 <svg
//                   className="w-5 h-5"
//                   fill="none"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
//                 </svg>
//               </button>
//               <button
//                 onClick={() => scrollToSection("how-it-works")}
//                 className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-montserrat font-semibold text-base sm:text-lg transition-all duration-200"
//               >
//                 <span>How It Works</span>
//                 <svg
//                   className="w-5 h-5"
//                   fill="none"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path d="M9 5l7 7-7 7"></path>
//                 </svg>
//               </button>
//             </div>

//             {/* Statistics */}
//             <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 pt-4 md:pt-6">
//               <div className="text-center sm:text-left">
//                 <div className="font-ibm text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
//                   500+
//                 </div>
//                 <div className="font-montserrat text-xs sm:text-sm md:text-base text-gray-600 mt-1">
//                   Projects Completed
//                 </div>
//               </div>
//               <div className="text-center sm:text-left">
//                 <div className="font-ibm text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
//                   98%
//                 </div>
//                 <div className="font-montserrat text-xs sm:text-sm md:text-base text-gray-600 mt-1">
//                   Approval Rate
//                 </div>
//               </div>
//               <div className="text-center sm:text-left">
//                 <div className="font-ibm text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
//                   24hrs
//                 </div>
//                 <div className="font-montserrat text-xs sm:text-sm md:text-base text-gray-600 mt-1">
//                   Average Delivery
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Section - Image */}
//           <div className="order-1 lg:order-2 relative">
//             <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-2xl">
//               <img
//                 src="/assets/hero.png"
//                 alt="CAD Design Example"
//                 className="w-full h-full object-cover"
//               />
//               {/* Overlay Box */}
//               <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/95 backdrop-blur-sm px-4 sm:px-5 py-3 sm:py-4 rounded-lg shadow-lg max-w-[200px] sm:max-w-[240px] md:max-w-[280px]">
//                 <div className="flex items-start gap-2 sm:gap-3">
//                   <svg
//                     className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0 mt-0.5"
//                     fill="none"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
//                   </svg>
//                   <p className="font-montserrat text-xs sm:text-sm md:text-base font-medium text-gray-800 leading-tight">
//                     Government Approved Professional CAD Drawings
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Hero;
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { t } from "../constants/translation";

const Hero = () => {
  const navigate = useNavigate();
  const lang = useSelector((state) => state.language?.lang || "en");

  const scrollToHowItWorks = () => {
    const element = document.getElementById("how-it-works");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center pt-20 md:pt-24 lg:pt-28">
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-blue-700 text-xs font-semibold tracking-wide uppercase">
              {t(lang, "hero.eyebrow")}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-4xl font-bold text-gray-900 leading-snug">
            {t(lang, "hero.title")}
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed">
            {t(lang, "hero.subtitle")}
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {t(lang, "hero.ctaPrimary")}
            </button>

            <button
              onClick={scrollToHowItWorks}
              className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-lg font-medium border border-gray-300 flex items-center gap-2 transition-colors"
            >
              {t(lang, "hero.ctaSecondary")}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="rounded-xl border border-gray-200 bg-white/60 px-4 py-3 flex flex-col gap-0.5">
              <div className="text-lg md:text-xl font-semibold text-gray-900">
                {t(lang, "hero.stats.priceValue")}
              </div>
              <div className="text-xs text-gray-600">
                {t(lang, "hero.stats.priceLabel")}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/60 px-4 py-3 flex flex-col gap-0.5">
              <div className="text-lg md:text-xl font-semibold text-gray-900">
                {t(lang, "hero.stats.deliveryValue")}
              </div>
              <div className="text-xs text-gray-600">
                {t(lang, "hero.stats.deliveryLabel")}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/60 px-4 py-3 flex flex-col gap-0.5">
              <div className="text-lg md:text-xl font-semibold text-gray-900">
                {t(lang, "hero.stats.regionValue")}
              </div>
              <div className="text-xs text-gray-600">
                {t(lang, "hero.stats.regionLabel")}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/60 px-4 py-3 flex flex-col gap-0.5">
              <div className="text-lg md:text-xl font-semibold text-gray-900">
                {t(lang, "hero.stats.qcValue")}
              </div>
              <div className="text-xs text-gray-600">
                {t(lang, "hero.stats.qcLabel")}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Video */}
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <video
              src="/assets/bgvid2.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Overlay Badge */}
            <div className="absolute bottom-8 left-8 bg-white rounded-xl shadow-lg p-4 flex items-start gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {t(lang, "hero.badge.title")}
                </div>
                <div className="text-sm text-gray-600">
                  {t(lang, "hero.badge.subtitle")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

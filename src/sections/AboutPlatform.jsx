// import React from "react";

// const AboutPlatform = () => {
//   return (
//     <section id="about-platform" className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
//       <div className="container mx-auto">
//         {/* Top Section - Header and Description */}
//         <div className="text-center mb-10 md:mb-14 lg:mb-16">
//           <h2 className="font-ibm text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-5">
//             About the Platform
//           </h2>
//           <p className="font-montserrat text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
//             We understand the challenges faced by rural land and property owners when dealing with government documentation.
//           </p>
//         </div>

//         {/* Middle Section - Problem and Solution Comparison */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
//           {/* The Problem Card */}
//           <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
//             <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5">
//               <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500 rounded-full flex items-center justify-center shrink-0">
//                 <svg
//                   className="w-5 h-5 md:w-6 md:h-6 text-white"
//                   fill="none"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
//                 </svg>
//               </div>
//               <div>
//                 <h3 className="font-ibm text-xl sm:text-2xl font-bold text-gray-800">
//                   The Problem
//                 </h3>
//                 <p className="font-montserrat text-sm sm:text-base text-gray-600 mt-1">
//                   Common challenges faced by land owners
//                 </p>
//               </div>
//             </div>
//             <ul className="space-y-3 md:space-y-4">
//               {[
//                 "Hand-drawn sketches often get rejected at government offices",
//                 "Multiple trips to offices waste time and money",
//                 "Difficult to find reliable CAD designers in rural areas",
//                 "Unclear pricing and long waiting times",
//               ].map((item, index) => (
//                 <li key={index} className="flex items-start gap-3">
//                   <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 shrink-0"></div>
//                   <span className="font-montserrat text-sm sm:text-base text-gray-700">
//                     {item}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Our Solution Card */}
//           <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
//             <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5">
//               <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
//                 <svg
//                   className="w-5 h-5 md:w-6 md:h-6 text-white"
//                   fill="none"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path d="M5 13l4 4L19 7"></path>
//                 </svg>
//               </div>
//               <div>
//                 <h3 className="font-ibm text-xl sm:text-2xl font-bold text-gray-800">
//                   Our Solution
//                 </h3>
//                 <p className="font-montserrat text-sm sm:text-base text-gray-600 mt-1">
//                   How we help you succeed
//                 </p>
//               </div>
//             </div>
//             <ul className="space-y-3 md:space-y-4">
//               {[
//                 "Upload sketches online from anywhere, anytime",
//                 "Expert CAD designers prepare government-ready drawings",
//                 "Fast turnaround with accurate dimensions and specifications",
//                 "Transparent pricing and quality assurance",
//               ].map((item, index) => (
//                 <li key={index} className="flex items-start gap-3">
//                   <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center shrink-0 mt-0.5">
//                     <svg
//                       className="w-3 h-3 text-white"
//                       fill="none"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                     >
//                       <path d="M5 13l4 4L19 7"></path>
//                     </svg>
//                   </div>
//                   <span className="font-montserrat text-sm sm:text-base text-gray-700">
//                     {item}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>

//         {/* Bottom Section - Feature Highlight Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
//           {/* Accurate Documentation Card */}
//           <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
//             <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 md:mb-5">
//               <svg
//                 className="w-7 h-7 md:w-8 md:h-8 text-blue-600"
//                 fill="none"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
//               </svg>
//             </div>
//             <h3 className="font-ibm text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-3">
//               Accurate Documentation
//             </h3>
//             <p className="font-montserrat text-sm sm:text-base text-gray-600">
//               Precise measurements and professional formatting
//             </p>
//           </div>

//           {/* Expert Designers Card */}
//           <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
//             <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 md:mb-5">
//               <svg
//                 className="w-7 h-7 md:w-8 md:h-8 text-blue-600"
//                 fill="none"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
//               </svg>
//             </div>
//             <h3 className="font-ibm text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-3">
//               Expert Designers
//             </h3>
//             <p className="font-montserrat text-sm sm:text-base text-gray-600">
//               Experienced CAD professionals at your service
//             </p>
//           </div>

//           {/* Quality Assured Card */}
//           <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
//             <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 md:mb-5">
//               <svg
//                 className="w-7 h-7 md:w-8 md:h-8 text-blue-600"
//                 fill="none"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
//               </svg>
//             </div>
//             <h3 className="font-ibm text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-3">
//               Quality Assured
//             </h3>
//             <p className="font-montserrat text-sm sm:text-base text-gray-600">
//               Every drawing reviewed before delivery
//             </p>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default AboutPlatform;
import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Users,
  Shield,
} from "lucide-react";

export default function AboutPlatform() {
  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            About the Platform
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            We understand the challenges faced by rural land and property owners
            when dealing with government documentation.
          </p>
        </div>

        {/* Problem and Solution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          {/* The Problem */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-50 rounded-full p-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  The Problem
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  Common challenges faced by land owners
                </p>
              </div>
            </div>

            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm md:text-base">
                  Hand-drawn sketches often get rejected at government offices
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm md:text-base">
                  Multiple trips to offices waste time and money
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm md:text-base">
                  Difficult to find reliable CAD designers in rural areas
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm md:text-base">
                  Unclear pricing and long waiting times
                </p>
              </li>
            </ul>
          </div>

          {/* Our Solution */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 rounded-full p-3">
                <CheckCircle2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Our Solution
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  How we help you succeed
                </p>
              </div>
            </div>

            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="bg-blue-500 rounded-md p-1 flex-shrink-0 h-fit">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700 text-sm md:text-base">
                  Upload sketches online from anywhere, anytime
                </p>
              </li>
              <li className="flex gap-3">
                <div className="bg-blue-500 rounded-md p-1 flex-shrink-0 h-fit">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700 text-sm md:text-base">
                  Expert CAD designers prepare government-ready drawings
                </p>
              </li>
              <li className="flex gap-3">
                <div className="bg-blue-500 rounded-md p-1 flex-shrink-0 h-fit">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700 text-sm md:text-base">
                  Fast turnaround with accurate dimensions and specifications
                </p>
              </li>
              <li className="flex gap-3">
                <div className="bg-blue-500 rounded-md p-1 flex-shrink-0 h-fit">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700 text-sm md:text-base">
                  Transparent pricing and quality assurance
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Accurate Documentation */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 md:p-8 text-center">
            <div className="bg-blue-50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
              Accurate Documentation
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Precise measurements and professional formatting
            </p>
          </div>

          {/* Expert Designers */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 md:p-8 text-center">
            <div className="bg-blue-50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
              Expert Designers
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Experienced CAD professionals at your service
            </p>
          </div>

          {/* Quality Assured */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 md:p-8 text-center">
            <div className="bg-blue-50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
              Quality Assured
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Every drawing reviewed before delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

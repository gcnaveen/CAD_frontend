import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import DraftList from "../../../components/drafts/DraftList.jsx";

const Home = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth?.role);
  const isSurveyor = role === "SURVEYOR";

  const topCards = [
    {
      id: 1,
      title: "Upload a Sketch",
      description: "Upload your hand-drawn sketch and get professional CAD drawings.",
      path: "/dashboard/user/upload",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
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
      ),
    },
    {
      id: 2,
      title: "Track Current Order",
      description: "Monitor the status of your ongoing CAD conversion projects.",
      path: "/dashboard/user/track-order",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
  ];

  const bottomCard = {
    id: 3,
    title: "View Order History",
    description: "Access all your past orders and download completed CAD files.",
    path: "/dashboard/user/order-history",
    icon: (
      <svg
        className="w-8 h-8 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const Card = ({ title, description, icon, path }) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => path && navigate(path)}
      onKeyDown={(e) => {
        if (!path) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(path);
        }
      }}
      className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-blue-300 cursor-pointer sm:p-7 md:p-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">
        {title}
      </h3>
      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
        {description}
      </p>
      <div className="mt-4 flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
        Get Started
        <svg
          className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
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
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Manage your CAD conversion projects
          </p>
        </div>

        {/* First row: 2 cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6">
          {topCards.map((card) => (
            <Card
              key={card.id}
              title={card.title}
              description={card.description}
              icon={card.icon}
              path={card.path}
            />
          ))}
        </div>

        {/* Second row: 1 card centered */}
        <div className="mt-5 md:mt-6 lg:mt-8 max-w-2xl mx-auto">
          <Card
            title={bottomCard.title}
            description={bottomCard.description}
            icon={bottomCard.icon}
            path={bottomCard.path}
          />
        </div>

        {isSurveyor ? (
          <div className="mt-10 md:mt-12">
            <DraftList />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Home;
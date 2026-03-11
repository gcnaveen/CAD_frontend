import React from "react";
import { Shield, Ruler, Clock, Award } from "lucide-react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const Benefits = () => {
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.benefits;

  const benefits = [
    { icon: Shield, ...tr?.cards?.[0] },
    { icon: Ruler, ...tr?.cards?.[1] },
    { icon: Clock, ...tr?.cards?.[2] },
    { icon: Award, ...tr?.cards?.[3] },
  ].map((b) => ({
    ...b,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  }));

  const stats = tr?.stats || [];

  return (
    <div
      id="benefits"
      className="w-full bg-gradient-to-b from-white to-gray-50 py-12 md:py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {tr?.title}
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            {tr?.subtitle}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start gap-4 md:gap-5">
                  {/* Icon */}
                  <div
                    className={`${benefit.iconBg} rounded-xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon
                      className={`w-7 h-7 md:w-8 md:h-8 ${benefit.iconColor}`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                      {benefit.title || ""}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                      {benefit.description || ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-8 md:p-12">
          {/* Trust Header */}
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              {tr?.trustTitle}
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {tr?.trustSubtitle}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Benefits;

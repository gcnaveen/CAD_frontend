import React from "react";
import { Upload, UserCheck, PenTool, Download, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

export default function HowItWorks() {
  const navigate = useNavigate();
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.howItWorks;

  const steps = [
    {
      number: 1,
      title: tr?.steps?.[0]?.title,
      description: tr?.steps?.[0]?.description,
      icon: Upload,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-500",
    },
    {
      number: 2,
      title: tr?.steps?.[1]?.title,
      description: tr?.steps?.[1]?.description,
      icon: UserCheck,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-500",
    },
    {
      number: 3,
      title: tr?.steps?.[2]?.title,
      description: tr?.steps?.[2]?.description,
      icon: PenTool,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-500",
    },
    {
      number: 4,
      title: tr?.steps?.[3]?.title,
      description: tr?.steps?.[3]?.description,
      icon: Download,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-500",
    },
  ];

  return (
    <div
      id="how-it-works"
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

        {/* Steps Container */}
        <div className="mb-12">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-stretch justify-center gap-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.number}>
                  {/* Card */}
                  <div className="flex-1 max-w-xs flex">
                    <div
                      className={`${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-8 h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                    >
                      {/* Icon */}
                      <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-6 shadow-sm">
                        <Icon className={`w-7 h-7 ${step.iconColor}`} />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.number}. {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-base text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Arrow between cards - hidden on last item */}
                  {index < steps.length - 1 && (
                    <div className="flex-shrink-0 px-4">
                      <ArrowRight className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Tablet Layout - 2 columns */}
          <div className="hidden md:grid lg:hidden grid-cols-2 gap-6 items-stretch">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.number}>
                  <div className="relative flex">
                    <div
                      className={`${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-8 h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                    >
                      {/* Icon */}
                      <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-6 shadow-sm">
                        <Icon className={`w-7 h-7 ${step.iconColor}`} />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.number}. {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-base text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Arrow after every 2nd item except the last */}
                  {(index === 1 || index === 3) && index < steps.length - 1 && (
                    <div className="col-span-2 flex justify-center py-2">
                      <ArrowRight className="w-8 h-8 text-gray-300 rotate-90" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.number}>
                  <div
                    className={`${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:shadow-lg`}
                  >
                    {/* Icon */}
                    <div className="bg-white rounded-full w-14 h-14 flex items-center justify-center mb-4 shadow-sm">
                      <Icon className={`w-6 h-6 ${step.iconColor}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {step.number}. {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow between cards - hidden on last item */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className="w-6 h-6 text-gray-300 rotate-90" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-base md:text-lg"
          >
            <Upload className="w-5 h-5" />
            {tr?.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

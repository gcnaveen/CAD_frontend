import React from "react";
import { Upload, UserCheck, PenTool, Download, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HowItWorks() {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: "Upload Your Sketch",
      description:
        "Pay ₹99/- as an advance and upload your hand-drawn land/property sketch. You can upload from your phone or computer.",
      icon: Upload,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-500",
    },
    {
      number: 2,
      title: "Our Team Reviews",
      description:
        "Our team reviews your sketch and assigns the best CAD designer for your project. We ensure quality at every step.",
      icon: UserCheck,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-500",
    },
    {
      number: 3,
      title: "Designer Creates CAD",
      description:
        "An experienced CAD designer converts your sketch into a professional, accurate, government-ready CAD drawing.",
      icon: PenTool,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-500",
    },
    {
      number: 4,
      title: "Download Final Design",
      description:
        "Pay the remaining ₹399/- and download your final, government-ready CAD drawing in the required format.",
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
            How It Works
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            Four simple steps to get your professional CAD drawing. No technical
            knowledge required.
          </p>
        </div>

        {/* Steps Container */}
        <div className="mb-12">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-center gap-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.number}>
                  {/* Card */}
                  <div className="flex-1 max-w-xs">
                    <div
                      className={`${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
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
          <div className="hidden md:grid lg:hidden grid-cols-2 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.number}>
                  <div className="relative">
                    <div
                      className={`${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
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
                    className={`${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg`}
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
            Get Started Now
          </button>
        </div>
      </div>
    </div>
  );
}

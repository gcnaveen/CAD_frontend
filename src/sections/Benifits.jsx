import React from "react";
import { Shield, Ruler, Clock, Award } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: Shield,
      title: "Government Approval Ready",
      description:
        "All drawings meet government standards and specifications, ensuring acceptance on the first submission.",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      icon: Ruler,
      title: "Accurate Dimensions",
      description:
        "Precise measurements and scale drawings that comply with technical requirements and building codes.",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      icon: Clock,
      title: "Saves Time & Office Visits",
      description:
        "No more multiple trips to government offices. Get it right the first time and submit with confidence.",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      icon: Award,
      title: "Expert CAD Professionals",
      description:
        "Your drawings are prepared by experienced CAD designers with proven track records in government submissions.",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
  ];

  const stats = [
    {
      value: "500+",
      label: "Drawings Delivered",
    },
    {
      value: "98%",
      label: "Approval Rate",
    },
    {
      value: "50+",
      label: "Villages Served",
    },
    {
      value: "4.8/5",
      label: "Customer Rating",
    },
  ];

  return (
    <div className="w-full bg-gradient-to-b from-white to-gray-50 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Key Benefits
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            Why land and property owners trust our CAD design service
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
                      {benefit.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                      {benefit.description}
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
              Trusted by Rural Land Owners Across the Region
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We understand the unique challenges of rural property
              documentation. Our platform is designed specifically for people
              who need reliable, professional CAD services without traveling to
              cities.
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

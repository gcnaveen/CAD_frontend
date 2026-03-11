import React from "react";
import { Play } from "lucide-react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const HowVideo = () => {
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.quality;

  const features = [
    {
      number: 1,
      title: tr?.points?.[0]?.title,
      description: tr?.points?.[0]?.description,
    },
    {
      number: 2,
      title: tr?.points?.[1]?.title,
      description: tr?.points?.[1]?.description,
    },
    {
      number: 3,
      title: tr?.points?.[2]?.title,
      description: tr?.points?.[2]?.description,
    },
  ];

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-16 md:mb-20 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-block bg-green-100 text-green-600 text-xs md:text-sm font-semibold px-4 py-2 rounded-full mb-4 md:mb-6">
              {tr?.tag}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              {tr?.title}
            </h1>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              {tr?.subtitle}
            </p>
          </div>

          {/* Right Image with Play Button */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-video bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop"
                alt="Woman presenting architectural drawing"
                className="w-full h-full object-cover"
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-blue-600 hover:bg-blue-700 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {features.map((feature) => (
            <div key={feature.number} className="group">
              {/* Number Badge */}
              <div className="bg-green-500 text-white rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center mb-4 md:mb-5 font-bold text-lg md:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                {feature.number}
              </div>

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowVideo;

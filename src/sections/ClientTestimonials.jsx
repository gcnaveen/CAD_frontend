import React, { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const ClientTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.testimonials;

  const testimonials = [
    {
      name: "Ramesh Kumar",
      location: "Village Rampur, UP",
      rating: 5,
      text: "I was visiting the tehsil office 4 times with my hand-drawn sketch. Every time they rejected it. With this service, I uploaded my sketch and got perfect CAD drawing in 2 days. Approved in first visit!",
    },
    {
      name: "Sunita Devi",
      location: "Dharwad, Karnataka",
      rating: 5,
      text: "Very easy process. I don't know computers much, but my son helped me upload the sketch from phone. The CAD drawing came exactly as needed for property registration. Saved us many trips to taluk office.",
    },
    {
      name: "Prakash Patil",
      location: "Nashik, Maharashtra",
      rating: 5,
      text: "Government office always said my drawing is not proper. Now with professional CAD design, they accepted immediately. Good service and helpful team. Highly recommend for all farmers and land owners.",
    },
    {
      name: "Lakshmi Reddy",
      location: "Anantapur, Andhra Pradesh",
      rating: 5,
      text: "Saved me so much time and money! The local CAD person wanted ₹5000 and 15 days. Here I got it in 3 days at half the price. The drawing quality is excellent and passed government check first time.",
    },
    {
      name: "Mohan Singh",
      location: "Alwar, Rajasthan",
      rating: 5,
      text: "I have 5 acres of agricultural land. Making proper boundary map was very difficult. This service made everything easy. They called me to clarify measurements and delivered perfect government-ready drawing.",
    },
    {
      name: "Kavita Sharma",
      location: "Satara, Maharashtra",
      rating: 5,
      text: "My husband passed away and I needed property transfer documents. The team was very understanding and helped me throughout. Got all CAD drawings for mutation within one week. Very grateful for their support.",
    },
    {
      name: "Rajesh Patel",
      location: "Mehsana, Gujarat",
      rating: 5,
      text: "Best decision to use this service! I was worried about accuracy of measurements. The designer called me twice to confirm all details. Final drawing had every dimension perfect. Revenue office approved without single question.",
    },
    {
      name: "Suresh Yadav",
      location: "Bhopal, Madhya Pradesh",
      rating: 5,
      text: "Very professional service. I uploaded sketch on Sunday night, got call on Monday morning, and received drawing by Tuesday evening. The speed and quality both are excellent. Will use again for my other properties.",
    },
    {
      name: "Anjali Desai",
      location: "Valsad, Gujarat",
      rating: 5,
      text: "I needed CAD drawing for building permission. Local person wanted ₹8000 and said come after 20 days. Found this service online, paid ₹3500 and got drawing in 4 days. Municipality accepted it without any changes!",
    },
  ];

  const itemsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  // Auto-play carousel
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isPaused, totalPages]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? totalPages - 1 : prevIndex - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages);
  };

  const getCurrentTestimonials = () => {
    const startIndex = currentIndex * itemsPerPage;
    return testimonials.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <div
      id="testimonials"
      className="w-full bg-gradient-to-b from-gray-50 to-white py-12 md:py-20 px-4 sm:px-6 lg:px-8"
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

        {/* Carousel Container */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
            {getCurrentTestimonials().map((testimonial, index) => (
              <div
                key={`${currentIndex}-${index}`}
                className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Star Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-sm md:text-base text-gray-700 italic leading-relaxed mb-6 flex-grow">
                  "{testimonial.text}"
                </p>

                {/* Author Info */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="font-bold text-gray-900 text-base md:text-lg">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center justify-center gap-4">
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-full p-3 transition-all duration-300 hover:border-blue-500 hover:text-blue-500 shadow-md hover:shadow-lg"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-blue-600"
                      : "w-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-full p-3 transition-all duration-300 hover:border-blue-500 hover:text-blue-500 shadow-md hover:shadow-lg"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Page Counter */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Page {currentIndex + 1} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientTestimonials;

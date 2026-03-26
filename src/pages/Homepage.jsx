import React from "react";
import Header from "../components/Header";
import Hero from "../sections/Hero";
import AboutPlatform from "../sections/AboutPlatform";
import HowItWorks from "../sections/HowItWorks";
import HowVideo from "../sections/HowVideo";
import Benifits from "../sections/Benifits";
import ClientTestimonials from "../sections/ClientTestimonials";
import Autocadskills from "../sections/Autocadskills";
import BeforeAfterSection from "../sections/BeforeAfterSection";
import Footer from "../components/Footer";

const Homepage = () => {
  return (
    <div className="homepage-font">
      <Header />
      <Hero />
      <AboutPlatform />
      <HowItWorks />
      <Autocadskills />
      <HowVideo />
      <BeforeAfterSection />
      <Benifits />
      <ClientTestimonials />
      <Footer />
    </div>
  );
};

export default Homepage;

import React, { lazy, Suspense } from "react";
import Header from "../components/Header";
import Hero from "../sections/Hero";
import Footer from "../components/Footer";

const AboutPlatform = lazy(() => import("../sections/AboutPlatform"));
const HowItWorks = lazy(() => import("../sections/HowItWorks"));
const HowVideo = lazy(() => import("../sections/HowVideo"));
const Benifits = lazy(() => import("../sections/Benifits"));
const ClientTestimonials = lazy(() => import("../sections/ClientTestimonials"));
const FAQ = lazy(() => import("../sections/FAQ"));
const Autocadskills = lazy(() => import("../sections/Autocadskills"));
const BeforeAfterSection = lazy(() => import("../sections/BeforeAfterSection"));

function BelowFold({ children }) {
  return (
    <Suspense fallback={<div className="min-h-[240px]" aria-hidden="true" />}>
      {children}
    </Suspense>
  );
}

const Homepage = () => {
  return (
    <div className="homepage-font">
      <Header />
      <Hero />
      <BelowFold>
        <AboutPlatform />
      </BelowFold>
      <BelowFold>
        <HowItWorks />
      </BelowFold>
      <BelowFold>
        <Autocadskills />
      </BelowFold>
      <BelowFold>
        <HowVideo />
      </BelowFold>
      <BelowFold>
        <BeforeAfterSection />
      </BelowFold>
      <BelowFold>
        <Benifits />
      </BelowFold>
      <BelowFold>
        <ClientTestimonials />
      </BelowFold>
      <BelowFold>
        <FAQ />
      </BelowFold>
      <Footer />
    </div>
  );
};

export default Homepage;

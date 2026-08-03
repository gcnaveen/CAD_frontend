import React, { lazy, Suspense } from "react";
import Header from "../components/Header";
import Hero from "../sections/Hero";
import Footer from "../components/Footer";
import LazySection from "../components/LazySection";

const AboutPlatform = lazy(() => import("../sections/AboutPlatform"));
const HowItWorks = lazy(() => import("../sections/HowItWorks"));
const HowVideo = lazy(() => import("../sections/HowVideo"));
const Benifits = lazy(() => import("../sections/Benifits"));
const ClientTestimonials = lazy(() => import("../sections/ClientTestimonials"));
const FAQ = lazy(() => import("../sections/FAQ"));
const Autocadskills = lazy(() => import("../sections/Autocadskills"));
const BeforeAfterSection = lazy(() => import("../sections/BeforeAfterSection"));

function BelowFold({ children, minHeight = 240 }) {
  return (
    <LazySection minHeight={minHeight}>
      <Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>
        {children}
      </Suspense>
    </LazySection>
  );
}

const Homepage = () => {
  return (
    <div className="homepage-font">
      <Header />
      <main id="main-content">
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
        <BelowFold minHeight={320}>
          <HowVideo />
        </BelowFold>
        <BelowFold minHeight={400}>
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
      </main>
      <Footer />
    </div>
  );
};

export default Homepage;

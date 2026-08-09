import React, { lazy, Suspense } from "react";
import { useEffect } from "react";
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

function BelowFold({ children, minHeight = 240, anchorId }) {
  return (
    <LazySection minHeight={minHeight} anchorId={anchorId}>
      <Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>
        {children}
      </Suspense>
    </LazySection>
  );
}

const Homepage = () => {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let attempts = 0;
    let timerId = null;

    const scrollToHashTarget = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;

      const target =
        document.getElementById(hash) ||
        document.querySelector(`[data-anchor-id="${hash}"]`);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      const exactSection = document.getElementById(hash);
      if (exactSection || attempts >= 12) return;

      attempts += 1;
      timerId = window.setTimeout(scrollToHashTarget, 200);
    };

    scrollToHashTarget();
    window.addEventListener("hashchange", scrollToHashTarget);
    return () => {
      if (timerId) window.clearTimeout(timerId);
      window.removeEventListener("hashchange", scrollToHashTarget);
    };
  }, []);

  return (
    <div className="homepage-font">
      <Header />
      <main id="main-content">
        <Hero />
        <BelowFold>
          <AboutPlatform />
        </BelowFold>
        <BelowFold anchorId="how-it-works">
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
        <BelowFold anchorId="benefits">
          <Benifits />
        </BelowFold>
        <BelowFold anchorId="testimonials">
          <ClientTestimonials />
        </BelowFold>
        <BelowFold anchorId="faq">
          <FAQ />
        </BelowFold>
      </main>
      <Footer />
    </div>
  );
};

export default Homepage;

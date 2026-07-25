import React from "react";
import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./dashboard/user/component/ScrollToTop";
import DocumentLang from "./components/DocumentLang.jsx";
import DocumentMeta from "./components/DocumentMeta.jsx";

const App = () => {
  return (
    <div className="theme-animate-surface min-h-screen bg-surface text-fg font-ibm overflow-x-hidden antialiased">
      <DocumentLang />
      <DocumentMeta />
      <ScrollToTop />
      <AppRoutes />
    </div>
  );
};

export default App;

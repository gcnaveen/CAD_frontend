import React from "react";
import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./dashboard/user/component/ScrollToTop";

const App = () => {
  return (
    <div className="theme-animate-surface min-h-screen bg-surface text-fg font-ibm overflow-x-hidden antialiased">
      <ScrollToTop />
      <AppRoutes />
    </div>
  );
};

export default App;

import React from "react";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <div className="theme-animate-surface min-h-screen bg-surface text-fg font-ibm overflow-x-hidden antialiased">
      <AppRoutes />
    </div>
  );
};

export default App;

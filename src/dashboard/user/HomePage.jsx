// import React from 'react'
// import UserDashboardHeader from "./component/Header";
// import Home from './component/Home'

// const HomePage = () => {
//   return (
//     <div>
//       <UserDashboardHeader />
//       <Home/>
//     </div>
//   )
// }

// export default HomePage
import React from "react";
import Home from "./component/Home";
import DashboardLayout from "./component/Dashboardlayout";

const HomePage = () => (
  <DashboardLayout>
    <Home />
  </DashboardLayout>
);

export default HomePage;

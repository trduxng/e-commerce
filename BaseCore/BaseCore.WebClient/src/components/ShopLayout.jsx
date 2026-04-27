import React from "react";
import Topbar from "./layout/Topbar";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";

const ShopLayout = ({ children }) => {
  return (
    <>
      <Topbar />
      <Navbar />
      {children}
      <Footer />
    </>
  );
};

export default ShopLayout;

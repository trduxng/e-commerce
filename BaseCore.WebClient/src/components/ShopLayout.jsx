import React from "react";
import Topbar from "./layout/Topbar";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import BackToTop from "./BackToTop";

const ShopLayout = ({ children }) => {
  return (
    <div className="storefront">
      <header className="storefront-shell">
        <Topbar />
        <Navbar />
      </header>
      {children}
      <Footer />
      <BackToTop />
    </div>
  );
};

export default ShopLayout;

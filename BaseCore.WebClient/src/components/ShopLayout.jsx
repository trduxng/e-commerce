import React from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./layout/Topbar";
import Footer from "./layout/Footer";
import BackToTop from "./BackToTop";

const ShopLayout = ({ children }) => {
  return (
    <div className="storefront">
      <header className="storefront-shell">
        <Topbar />
      </header>
      {children || <Outlet />}
      <Footer />
      <BackToTop />
    </div>
  );
};

export default ShopLayout;

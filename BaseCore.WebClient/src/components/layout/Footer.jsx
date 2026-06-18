import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";

const Footer = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { settings } = useSettings();

  return (
    <div className="container-fluid storefront-footer pt-5">
      <div className="row px-xl-5 pt-5">
        <div className="col-lg-4 col-md-12 mb-5 pe-3 pe-xl-5">
          <h5 className="text-uppercase mb-4">Get In Touch</h5>
          <p className="mb-4">{settings.storeName} is the public storefront for BaseCore WebClient with product browsing, cart and checkout flows.</p>
          <p className="mb-2">
            <i className="fa fa-map-marker-alt text-primary me-3"></i>{settings.address}
          </p>
          <p className="mb-2">
            <i className="fa fa-envelope text-primary me-3"></i>{settings.contactEmail}
          </p>
          <p className="mb-0">
            <i className="fa fa-phone-alt text-primary me-3"></i>{settings.contactPhone}
          </p>
        </div>

        <div className="col-lg-8 col-md-12">
          <div className="row">
            <div className="col-md-4 mb-5">
              <h5 className="text-uppercase mb-4">Quick Shop</h5>
              <div className="d-flex flex-column justify-content-start">
                <Link className="text-secondary mb-2" to="/"><i className="fa fa-angle-right me-2"></i>Home</Link>
                <Link className="text-secondary mb-2" to="/shop"><i className="fa fa-angle-right me-2"></i>Our Shop</Link>
                <Link className="text-secondary mb-2" to="/cart"><i className="fa fa-angle-right me-2"></i>Shopping Cart</Link>
                <Link className="text-secondary mb-2" to="/checkout"><i className="fa fa-angle-right me-2"></i>Checkout</Link>
                <Link className="text-secondary" to="/contact"><i className="fa fa-angle-right me-2"></i>Contact Us</Link>
              </div>
            </div>

            <div className="col-md-4 mb-5">
              <h5 className="text-uppercase mb-4">My Account</h5>
              <div className="d-flex flex-column justify-content-start">
                <Link className="text-secondary mb-2" to="/login"><i className="fa fa-angle-right me-2"></i>Sign In</Link>
                {isAuthenticated && <Link className="text-secondary mb-2" to="/my-orders"><i className="fa fa-angle-right me-2"></i>My Orders</Link>}
                {isAdmin() && (
                  <>
                    <Link className="text-secondary mb-2" to="/admin/dashboard"><i className="fa fa-angle-right me-2"></i>Dashboard</Link>
                    <Link className="text-secondary mb-2" to="/products"><i className="fa fa-angle-right me-2"></i>Manage Products</Link>
                    <Link className="text-secondary" to="/categories"><i className="fa fa-angle-right me-2"></i>Manage Categories</Link>
                  </>
                )}
              </div>
            </div>

            <div className="col-md-4 mb-5">
              <h5 className="text-uppercase mb-4">Newsletter</h5>
              <p>Receive product updates and seasonal offers.</p>
              <form>
                <div className="input-group">
                  <input type="email" className="form-control" placeholder="Your Email Address" />
                  <button className="btn btn-primary" type="submit" onClick={(e) => e.preventDefault()}>Sign Up</button>
                </div>
              </form>
              <h6 className="text-uppercase mt-4 mb-3">Follow Us</h6>
              <div className="d-flex">
                {settings.twitterLink && settings.twitterLink !== '#' && <a className="btn btn-primary btn-square me-2" href={settings.twitterLink} target="_blank" rel="noreferrer" aria-label="Twitter"><i className="fab fa-twitter"></i></a>}
                {settings.facebookLink && settings.facebookLink !== '#' && <a className="btn btn-primary btn-square me-2" href={settings.facebookLink} target="_blank" rel="noreferrer" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>}
                <a className="btn btn-primary btn-square me-2" href="#linkedin" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                {settings.instagramLink && settings.instagramLink !== '#' && <a className="btn btn-primary btn-square" href={settings.instagramLink} target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row border-top mx-xl-5 py-4" style={{ borderColor: "rgba(256, 256, 256, .1)" }}>
        <div className="col-md-6 px-xl-0">
          <p className="mb-md-0 text-center text-md-left text-secondary">
            &copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>
        </div>
        <div className="col-md-6 px-xl-0 text-center text-md-end">
          <img className="img-fluid" src="/img/payments.png" alt="Payment methods" />
        </div>
      </div>
    </div>
  );
};

export default Footer;

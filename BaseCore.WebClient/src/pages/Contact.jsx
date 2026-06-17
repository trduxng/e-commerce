import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";

const Contact = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <>
      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <nav className="breadcrumb bg-light mb-30">
              <Link className="breadcrumb-item text-dark" to="/">Home</Link>
              <span className="breadcrumb-item active">Contact</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <h2 className="section-title position-relative text-uppercase mx-xl-5 mb-4">
          <span className="bg-secondary pe-3">Contact Us</span>
        </h2>
        <div className="row px-xl-5">
          <div className="col-lg-7 mb-5">
            <div className="bg-light p-30">
              {submitted && (
                <div className="alert alert-success">
                  Your message has been recorded in the frontend. Connect a contact API to persist it.
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="control-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="control-group mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Your Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="control-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="control-group mb-3">
                  <textarea
                    className="form-control"
                    rows="8"
                    placeholder="Message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                <button className="btn btn-primary py-2 px-4" type="submit">
                  Send Message
                </button>
              </form>
            </div>
          </div>

          <div className="col-lg-5 mb-5">
            <div className="bg-light p-30 mb-30">
              <iframe
                title="BaseShop location"
                style={{ width: "100%", height: "315px", border: 0 }}
                src="https://www.google.com/maps?q=Ho%20Chi%20Minh%20City%2C%20Vietnam&output=embed"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className="bg-light p-30 mb-3">
              <p className="mb-2">
                <i className="fa fa-map-marker-alt text-primary me-3"></i>
                {settings.address}
              </p>
              <p className="mb-2">
                <i className="fa fa-envelope text-primary me-3"></i>
                {settings.contactEmail}
              </p>
              <p className="mb-2">
                <i className="fa fa-phone-alt text-primary me-3"></i>
                {settings.contactPhone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;

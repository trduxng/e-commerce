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
          <h5 className="text-uppercase mb-4">Thông tin liên hệ</h5>
          <p className="mb-4">{settings.storeName} mang đến trải nghiệm mua sắm trực tuyến thuận tiện, từ tìm kiếm sản phẩm đến giỏ hàng và thanh toán.</p>
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
              <h5 className="text-uppercase mb-4">Mua sắm nhanh</h5>
              <div className="d-flex flex-column justify-content-start">
                <Link className="text-secondary mb-2" to="/"><i className="fa fa-angle-right me-2"></i>Trang chủ</Link>
                <Link className="text-secondary mb-2" to="/shop"><i className="fa fa-angle-right me-2"></i>Cửa hàng</Link>
                <Link className="text-secondary mb-2" to="/cart"><i className="fa fa-angle-right me-2"></i>Giỏ hàng</Link>
                <Link className="text-secondary mb-2" to="/checkout"><i className="fa fa-angle-right me-2"></i>Thanh toán</Link>
                <Link className="text-secondary" to="/contact"><i className="fa fa-angle-right me-2"></i>Liên hệ</Link>
              </div>
            </div>

            <div className="col-md-4 mb-5">
              <h5 className="text-uppercase mb-4">Tài khoản của tôi</h5>
              <div className="d-flex flex-column justify-content-start">
                <Link className="text-secondary mb-2" to="/login"><i className="fa fa-angle-right me-2"></i>Đăng nhập</Link>
                {isAuthenticated && <Link className="text-secondary mb-2" to="/my-orders"><i className="fa fa-angle-right me-2"></i>Đơn hàng của tôi</Link>}
                {isAdmin() && (
                  <>
                    <Link className="text-secondary mb-2" to="/admin/dashboard"><i className="fa fa-angle-right me-2"></i>Bảng điều khiển</Link>
                    <Link className="text-secondary mb-2" to="/products"><i className="fa fa-angle-right me-2"></i>Quản lý sản phẩm</Link>
                    <Link className="text-secondary" to="/categories"><i className="fa fa-angle-right me-2"></i>Quản lý danh mục</Link>
                  </>
                )}
              </div>
            </div>

            <div className="col-md-4 mb-5">
              <h5 className="text-uppercase mb-4">Đăng ký nhận tin</h5>
              <p>Nhận thông tin sản phẩm mới và các ưu đãi theo mùa.</p>
              <form>
                <div className="input-group">
                  <input type="email" className="form-control" placeholder="Địa chỉ email của bạn" />
                  <button className="btn btn-primary" type="submit" onClick={(e) => e.preventDefault()}>Đăng ký</button>
                </div>
              </form>
              <h6 className="text-uppercase mt-4 mb-3">Theo dõi chúng tôi</h6>
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
            &copy; {new Date().getFullYear()} {settings.storeName}. Bảo lưu mọi quyền.
          </p>
        </div>
        <div className="col-md-6 px-xl-0 text-center text-md-end">
          <img className="img-fluid" src="/img/payments.png" alt="Phương thức thanh toán" />
        </div>
      </div>
    </div>
  );
};

export default Footer;

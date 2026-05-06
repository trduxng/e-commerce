import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { categoryApi, productApi } from "../services/api";
import { resolveImageUrl } from "../data/shopData";
import { normalizeProductList } from "../data/shopData";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll({ page: 1, pageSize: 8 }),
        ]);

        const apiCategories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
        const apiProducts = normalizeProductList(productsResponse.data);

        setCategories(apiCategories);
        setProducts(apiProducts);
        setError("");
      } catch {
        setCategories([]);
        setProducts([]);
        setError("Cannot load products from database. Please start ApiGateway and APIService.");
      }
    };

    loadHomeData();
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);

  return (
    <>
      <div className="container-fluid mb-3">
        <div className="row px-xl-5">
          <div className="col-lg-8">
            <div id="header-carousel" className="carousel slide carousel-fade mb-30 mb-lg-0" data-ride="carousel">
              <ol className="carousel-indicators">
                <li data-target="#header-carousel" data-slide-to="0" className="active"></li>
                <li data-target="#header-carousel" data-slide-to="1"></li>
                <li data-target="#header-carousel" data-slide-to="2"></li>
              </ol>
              <div className="carousel-inner">
                {[
                  { image: "/img/carousel-1.jpg", title: "Fresh arrivals for everyday shopping" },
                  { image: "/img/carousel-2.jpg", title: "Curated products, simple checkout" },
                  { image: "/img/carousel-3.jpg", title: "Reliable deals from BaseCore Shop" },
                ].map((slide, index) => (
                  <div key={slide.image} className={`carousel-item position-relative ${index === 0 ? "active" : ""}`} style={{ height: "430px" }}>
                    <img className="position-absolute w-100 h-100" src={slide.image} alt={slide.title} style={{ objectFit: "cover" }} />
                    <div className="carousel-caption d-flex flex-column align-items-center justify-content-center">
                      <div className="p-3" style={{ maxWidth: "700px" }}>
                        <h1 className="display-4 text-white mb-3 animate__animated animate__fadeInDown">{slide.title}</h1>
                        <p className="mx-md-5 px-5 animate__animated animate__bounceIn">Browse products, add to cart and complete checkout in one storefront.</p>
                        <Link className="btn btn-outline-light py-2 px-4 mt-3 animate__animated animate__fadeInUp" to="/shop">
                          Shop Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="product-offer mb-30" style={{ height: "200px" }}>
              <img className="img-fluid" src="/img/offer-1.jpg" alt="Special offer" />
              <div className="offer-text">
                <h6 className="text-white text-uppercase">Save 20%</h6>
                <h3 className="text-white mb-3">Special Offer</h3>
                <Link to="/shop" className="btn btn-primary">Shop Now</Link>
              </div>
            </div>
            <div className="product-offer mb-30" style={{ height: "200px" }}>
              <img className="img-fluid" src="/img/offer-2.jpg" alt="New collection" />
              <div className="offer-text">
                <h6 className="text-white text-uppercase">New season</h6>
                <h3 className="text-white mb-3">Latest Products</h3>
                <Link to="/shop" className="btn btn-primary">Shop Now</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid pt-5">
        <div className="row px-xl-5 pb-3">
          {[
            ["fa-check", "Quality Product"],
            ["fa-shipping-fast", "Fast Shipping"],
            ["fa-exchange-alt", "14-Day Return"],
            ["fa-phone-volume", "24/7 Support"],
          ].map(([icon, label]) => (
            <div key={label} className="col-lg-3 col-md-6 col-sm-12 pb-1">
              <div className="d-flex align-items-center bg-light mb-4" style={{ padding: "30px" }}>
                <h1 className={`fa ${icon} text-primary m-0 mr-3`}></h1>
                <h5 className="font-weight-semi-bold m-0">{label}</h5>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-fluid pt-5">
        <h2 className="section-title position-relative text-uppercase mx-xl-5 mb-4">
          <span className="bg-secondary pr-3">Categories</span>
        </h2>
        <div className="row px-xl-5 pb-3">
          {error && <div className="col-12"><div className="alert alert-warning">{error}</div></div>}
          {categories.slice(0, 8).map((category, index) => (
            <div key={category.id} className="col-lg-3 col-md-4 col-sm-6 pb-1">
              <Link className="text-decoration-none" to={`/shop?categoryId=${category.id}`}>
                <div className="cat-item d-flex align-items-center mb-4">
                  <div className="overflow-hidden" style={{ width: "100px", height: "100px" }}>
                    <img className="img-fluid" src={resolveImageUrl(category.imageUrl || category.image || `/img/cat-${(index % 4) + 1}.jpg`)} alt={category.name} />
                  </div>
                  <div className="flex-fill pl-3">
                    <h6>{category.name}</h6>
                    <small className="text-body">View products</small>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="container-fluid pt-5 pb-3">
        <h2 className="section-title position-relative text-uppercase mx-xl-5 mb-4">
          <span className="bg-secondary pr-3">Featured Products</span>
        </h2>
        <div className="row px-xl-5">
          {featuredProducts.length === 0 && !error ? (
            <div className="col-12">
              <div className="bg-light p-5 text-center">No products found in database.</div>
            </div>
          ) : featuredProducts.map((product) => (
            <div key={product.id} className="col-lg-3 col-md-4 col-sm-6 pb-1">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <div className="container-fluid py-5">
        <div className="row px-xl-5">
          {[1, 2, 3, 4, 5, 6].map((number) => (
            <div key={number} className="col">
              <div className="bg-light p-4">
                <img src={`/img/vendor-${number}.jpg`} alt={`Vendor ${number}`} className="img-fluid" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;

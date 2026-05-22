import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { categoryApi, productApi } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import {
  getProductPrice,
  normalizeCategoryList,
  normalizeProductList,
  sampleCategories,
  sampleProducts,
} from "../data/shopData";

const heroSlides = [
  {
    image: "/img/carousel-1.jpg",
    badge: "New Collection",
    title: "Fresh arrivals for everyday shopping",
    description: "Discover quality products, simple checkout, and reliable service in one modern storefront.",
  },
  {
    image: "/img/carousel-2.jpg",
    badge: "Easy Shopping",
    title: "Curated products, simple checkout",
    description: "Browse trending products and enjoy a smoother shopping experience from start to finish.",
  },
  {
    image: "/img/carousel-3.jpg",
    badge: "Best Deals",
    title: "Reliable deals from BaseCore Shop",
    description: "Find everyday essentials and seasonal offers carefully selected for you.",
  },
];

const features = [
  ["fa-check", "Quality Product", "Carefully selected products"],
  ["fa-shipping-fast", "Fast Shipping", "Quick and reliable delivery"],
  ["fa-exchange-alt", "14-Day Return", "Easy return policy"],
  ["fa-phone-volume", "24/7 Support", "Always ready to help"],
];

const categoryImages = [
  "/img/cat-1.jpg",
  "/img/product-6.jpg",
  "/img/cat-2.jpg",
  "/img/product-3.jpg",
  "/img/cat-4.jpg",
  "/img/product-8.jpg",
];

const Home = () => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll({ page: 1, pageSize: 12 }),
        ]);

        const apiCategories = normalizeCategoryList(categoriesResponse.data);

        const apiProducts = normalizeProductList(productsResponse.data);

        setCategories(apiCategories.length > 0 ? apiCategories : sampleCategories);
        setProducts(apiProducts.length > 0 ? apiProducts : sampleProducts);
        setError("");
      } catch {
        setCategories(sampleCategories);
        setProducts(sampleProducts);
        setError(
          "API is not available, so the storefront is showing demo products."
        );
        toast.warning("API is not available, so the storefront is showing demo products.", {
          dedupeKey: "home-api-fallback",
        });
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [toast]);

  const featuredProducts = useMemo(() => {
    const featured = products.filter((product) => product.isFeatured);
    return (featured.length > 0 ? featured : products).slice(0, 8);
  }, [products]);
  const newProducts = useMemo(
    () =>
      [...products]
        .sort((first, second) => {
          const firstDate = new Date(first.createdAt || 0).getTime() || Number(first.id || 0);
          const secondDate = new Date(second.createdAt || 0).getTime() || Number(second.id || 0);
          return secondDate - firstDate;
        })
        .slice(0, 4),
    [products]
  );
  const bestSellingProducts = useMemo(
    () =>
      [...products]
        .sort((first, second) => {
          const soldDiff = Number(second.soldCount || 0) - Number(first.soldCount || 0);
          return soldDiff || getProductPrice(second) - getProductPrice(first);
        })
        .slice(0, 4),
    [products]
  );
  const topCategories = useMemo(() => categories.slice(0, 8), [categories]);

  return (
    <main className="home-page pb-5">
      <section className="container-fluid storefront-hero-section">
        <div className="row px-xl-5">
          <div className="col-lg-8">
            <div
              id="header-carousel"
              className="carousel slide carousel-fade hero-carousel"
              data-bs-ride="carousel"
            >
              <ol className="carousel-indicators">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    data-bs-target="#header-carousel"
                    data-bs-slide-to={index}
                    className={index === 0 ? "active" : ""}
                    aria-current={index === 0 ? "true" : undefined}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </ol>

              <div className="carousel-inner">
                {heroSlides.map((slide, index) => (
                  <div
                    key={slide.image}
                    className={`carousel-item hero-slide ${index === 0 ? "active" : ""}`}
                  >
                    <img src={slide.image} alt={slide.title} />

                    <div className="hero-content">
                      <div className="hero-copy">
                        <span className="hero-badge">{slide.badge}</span>
                        <h1 className="hero-title">{slide.title}</h1>
                        <p className="hero-description">{slide.description}</p>

                        <div className="home-actions">
                          <Link className="btn btn-primary btn-lg" to="/shop">
                            <i className="fas fa-bag-shopping me-2"></i>
                            Shop Now
                          </Link>
                          <Link className="btn btn-outline-light btn-lg" to="/shop">
                            Explore Products
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4 mt-4 mt-lg-0">
            <div className="offer-card offer-card-large mb-4">
              <img src="/img/offer-1.jpg" alt="Special offer" />
              <div className="offer-content">
                <span>Save 20%</span>
                <h3>Special Offer</h3>
                <Link to="/shop" className="btn btn-light">
                  Shop Now
                </Link>
              </div>
            </div>

            <div className="offer-card">
              <img src="/img/offer-2.jpg" alt="Latest products" />
              <div className="offer-content">
                <span>New Season</span>
                <h3>Latest Products</h3>
                <Link to="/shop" className="btn btn-light">
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid section-block feature-strip">
        <div className="row px-xl-5">
          {features.map(([icon, title, description]) => (
            <div key={title} className="col-lg-3 col-md-6 col-sm-12 mb-4">
              <div className="feature-card d-flex align-items-center">
                <div className="feature-icon">
                  <i className={`fa ${icon}`} />
                </div>

                <div>
                  <h5 className="mb-1">{title}</h5>
                  <small>{description}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-fluid section-block">
        <div className="section-heading">
          <span className="section-kicker">Shop by category</span>
          <h2 className="section-title-modern">Popular Categories</h2>
          <p className="section-subtitle">
            Explore product collections made for everyday shopping
          </p>
        </div>

        <div className="row px-xl-5">
          {error && (
            <div className="col-12">
              <div className="alert alert-info">{error}</div>
            </div>
          )}

          {topCategories.map((category, index) => (
            <div key={category.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
              <Link className="category-card text-decoration-none" to={`/shop?categoryId=${category.id}`}>
                <div className="category-image">
                  <img src={categoryImages[index % categoryImages.length]} alt={category.name} />
                </div>

                <div className="category-meta">
                  <h5>{category.name}</h5>
                  <span>View products</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container-fluid section-block">
        <div className="section-heading">
          <span className="section-kicker">Hand picked</span>
          <h2 className="section-title-modern">Featured Products</h2>
          <p className="section-subtitle">
            Discover products selected for quality, style, and value
          </p>
        </div>

        <div className="row px-xl-5">
          {loading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="col-12">
              <div className="empty-state">No products found in database.</div>
            </div>
          ) : (
            featuredProducts.map((product) => (
              <div key={product.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
                <ProductCard product={product} />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="container-fluid section-block">
        <div className="section-heading">
          <span className="section-kicker">Just arrived</span>
          <h2 className="section-title-modern">New Products</h2>
          <p className="section-subtitle">
            Fresh picks ready for quick browsing and checkout
          </p>
        </div>

        <div className="row px-xl-5">
          {newProducts.map((product) => (
            <div key={product.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      <section className="container-fluid section-block">
        <div className="section-heading">
          <span className="section-kicker">Customer favorites</span>
          <h2 className="section-title-modern">Best Selling</h2>
          <p className="section-subtitle">
            Popular products with strong value and everyday appeal
          </p>
        </div>

        <div className="row px-xl-5">
          {bestSellingProducts.map((product) => (
            <div key={product.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      <section className="container-fluid section-block">
        <div className="section-heading">
          <span className="section-kicker">Trusted brands</span>
          <h2 className="section-title-modern">Our Vendors</h2>
        </div>

        <div className="row px-xl-5">
          {[1, 2, 3, 4, 5, 6].map((number) => (
            <div key={number} className="col-lg-2 col-md-3 col-6 mb-4">
              <div className="vendor-card">
                <img
                  src={`/img/vendor-${number}.jpg`}
                  alt={`Vendor ${number}`}
                  className="img-fluid"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductSkeletonGrid from "../components/ProductSkeletonGrid";
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
    badge: "Bộ sưu tập mới",
    title: "Sản phẩm mới mỗi ngày",
    description: "Khám phá sản phẩm chất lượng, thanh toán đơn giản và dịch vụ đáng tin cậy trên một nền tảng mua sắm hiện đại.",
  },
  {
    image: "/img/carousel-2.jpg",
    badge: "Mua sắm dễ dàng",
    title: "Sản phẩm tuyển chọn, thanh toán thuận tiện",
    description: "Khám phá sản phẩm thịnh hành và tận hưởng trải nghiệm mua sắm liền mạch từ đầu đến cuối.",
  },
  {
    image: "/img/carousel-3.jpg",
    badge: "Ưu đãi hấp dẫn",
    title: "Ưu đãi đáng tin cậy từ BaseCore Shop",
    description: "Tìm kiếm sản phẩm thiết yếu và ưu đãi theo mùa được tuyển chọn dành riêng cho bạn.",
  },
];

const features = [
  ["fa-check", "Sản phẩm chất lượng", "Sản phẩm được tuyển chọn kỹ lưỡng"],
  ["fa-shipping-fast", "Giao hàng nhanh", "Giao hàng nhanh chóng và đáng tin cậy"],
  ["fa-exchange-alt", "Đổi trả trong 14 ngày", "Chính sách đổi trả dễ dàng"],
  ["fa-phone-volume", "Hỗ trợ 24/7", "Luôn sẵn sàng hỗ trợ"],
];

const categoryImages = [
  "/img/sg-11134301-82253-mhfmag7x8sncbb.webp",
  "/img/product-4.jpg",
  "/img/vn-11134207-81ztc-mm5wbr3xuqro8b.webp",
  "/img/vn-11134207-81ztc-mp3p9dzmknwte0.webp",
  "/img/cat-4.jpg",
  "/img/product-8.jpg",
];

const Home = () => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Tải danh mục và sản phẩm nổi bật song song; khi lỗi sẽ dùng dữ liệu mẫu.
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [categoriesResponse, productsResponse, featuredProductsResponse] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll({ publishedId: 1, page: 1, pageSize: 12 }),
          productApi.getAll({
            publishedId: 1,
            isFeatured: true,
            sortField: "id",
            sortDir: "desc",
            page: 1,
            pageSize: 8,
          }),
        ]);

        const apiCategories = normalizeCategoryList(categoriesResponse.data);
        const apiProducts = normalizeProductList(productsResponse.data);
        const apiFeaturedProducts = normalizeProductList(featuredProductsResponse.data)
          .filter((product) => product.isFeatured && product.isActive !== false)
          .slice(0, 8);

        setCategories(apiCategories.length > 0 ? apiCategories : sampleCategories);
        setProducts(apiProducts.length > 0 ? apiProducts : sampleProducts);
        setFeaturedProducts(apiFeaturedProducts);
        setError("");
      } catch {
        setCategories(sampleCategories);
        setProducts(sampleProducts);
        setFeaturedProducts(sampleProducts.slice(0, 8));
        setError(
          "Không thể kết nối API, cửa hàng đang hiển thị sản phẩm mẫu."
        );
        toast.warning("Không thể kết nối API, cửa hàng đang hiển thị sản phẩm mẫu.", {
          dedupeKey: "home-api-fallback",
        });
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [toast]);

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
  const topCategories = useMemo(() => categories.slice(0, 4), [categories]);

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
                    aria-label={`Trang trình chiếu ${index + 1}`}
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
                            Mua ngay
                          </Link>
                          <Link className="btn btn-outline-light btn-lg" to="/shop">
                            Khám phá sản phẩm
                          </Link>
                        </div>

                        <div className="hero-metrics" aria-label="Điểm nổi bật của cửa hàng">
                          <div>
                            <strong>1000+</strong>
                            <span>Sản phẩm</span>
                          </div>
                          <div>
                            <strong>24/7</strong>
                            <span>Hỗ trợ</span>
                          </div>
                          <div>
                            <strong>4.8</strong>
                            <span>Đánh giá</span>
                          </div>
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
              <img src="/img/offer-1.jpg" alt="Ưu đãi đặc biệt" />
              <div className="offer-content">
                <span>Giảm giá 20%</span>
                <h3>Ưu đãi đặc biệt</h3>
                <Link to="/shop" className="btn btn-light">
                  Mua ngay
                </Link>
              </div>
            </div>

            <div className="offer-card">
              <img src="/img/offer-2.jpg" alt="Sản phẩm mới nhất" />
              <div className="offer-content">
                <span>Bộ sưu tập mới</span>
                <h3>Sản phẩm mới nhất</h3>
                <Link to="/shop" className="btn btn-light">
                  Mua ngay
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
          <span className="section-kicker">Mua sắm theo danh mục</span>
          <h2 className="section-title-modern">Danh mục phổ biến</h2>
          <p className="section-subtitle">
            Khám phá các bộ sưu tập phù hợp với nhu cầu mua sắm hằng ngày
          </p>
        </div>

        <div className="row px-xl-5">
          {error && (
            <div className="col-12">
              <div className="alert alert-info">{error}</div>
            </div>
          )}

          {topCategories.length === 0 && <div className="col-12"><div className="empty-state">Chưa có danh mục nào.</div></div>}
          {topCategories.map((category, index) => (
            <div key={category.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
              <Link className="category-card text-decoration-none" to={`/shop?categoryId=${category.id}`}>
                <div className="category-image">
                  <img src={categoryImages[index % categoryImages.length]} alt={category.name} />
                </div>

                <div className="category-meta">
                  <h5>{category.name}</h5>
                  <span>Xem sản phẩm</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container-fluid section-block">
        <div className="section-heading">
          <span className="section-kicker">Tuyển chọn dành cho bạn</span>
          <h2 className="section-title-modern">Sản phẩm nổi bật</h2>
          <p className="section-subtitle">
            Khám phá sản phẩm được lựa chọn dựa trên chất lượng, phong cách và giá trị
          </p>
        </div>

        <div className="row px-xl-5">
          {loading ? (
            <ProductSkeletonGrid count={8} />
          ) : featuredProducts.length === 0 ? (
            <div className="col-12">
              <div className="empty-state">Không tìm thấy sản phẩm trong hệ thống.</div>
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
          <span className="section-kicker">Hàng mới về</span>
          <h2 className="section-title-modern">Sản phẩm mới</h2>
          <p className="section-subtitle">
            Những lựa chọn mới sẵn sàng để bạn khám phá và thanh toán nhanh chóng
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
          <span className="section-kicker">Được khách hàng yêu thích</span>
          <h2 className="section-title-modern">Sản phẩm bán chạy</h2>
          <p className="section-subtitle">
            Những sản phẩm phổ biến, thiết thực và có giá trị vượt trội
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
          <span className="section-kicker">Thương hiệu uy tín</span>
          <h2 className="section-title-modern">Đối tác của chúng tôi</h2>
        </div>

        <div className="row px-xl-5">
          {[1, 2, 3, 4, 5, 6].map((number) => (
            <div key={number} className="col-lg-2 col-md-3 col-6 mb-4">
              <div className="vendor-card">
                <img
                  src={`/img/vendor-${number}.jpg`}
                  alt={`Đối tác ${number}`}
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

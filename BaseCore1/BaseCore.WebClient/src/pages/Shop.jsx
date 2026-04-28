import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { categoryApi, productApi } from "../services/api";
import {
  formatCurrency,
  getProductCategoryName,
  normalizeProductList,
} from "../data/shopData";

const priceRanges = [
  { label: "All Price", min: 0, max: Infinity },
  { label: "Under 500K", min: 0, max: 500000 },
  { label: "500K - 1M", min: 500000, max: 1000000 },
  { label: "1M - 2M", min: 1000000, max: 2000000 },
  { label: "Over 2M", min: 2000000, max: Infinity },
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("latest");
  const [priceIndex, setPriceIndex] = useState(0);

  const keyword = searchParams.get("keyword") || "";
  const categoryId = searchParams.get("categoryId") || "";

  useEffect(() => {
    const loadShop = async () => {
      setLoading(true);
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          categoryApi.getAll(),
          productApi.search({
            keyword: keyword || undefined,
            categoryId: categoryId || undefined,
            page: 1,
            pageSize: 48,
          }),
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
      } finally {
        setLoading(false);
      }
    };

    loadShop();
  }, [keyword, categoryId]);

  const visibleProducts = useMemo(() => {
    const range = priceRanges[priceIndex];
    const normalizedKeyword = keyword.toLowerCase();

    const filtered = products.filter((product) => {
      const matchesKeyword = !normalizedKeyword || product.name?.toLowerCase().includes(normalizedKeyword);
      const matchesCategory = !categoryId || Number(product.categoryId || product.category?.id) === Number(categoryId);
      const price = Number(product.price || 0);
      const matchesPrice = price >= range.min && price <= range.max;
      return matchesKeyword && matchesCategory && matchesPrice;
    });

    return [...filtered].sort((first, second) => {
      if (sort === "price-asc") return Number(first.price || 0) - Number(second.price || 0);
      if (sort === "price-desc") return Number(second.price || 0) - Number(first.price || 0);
      if (sort === "name") return first.name.localeCompare(second.name);
      return Number(second.id || 0) - Number(first.id || 0);
    });
  }, [products, keyword, categoryId, priceIndex, sort]);

  const updateCategory = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("categoryId", value);
    else params.delete("categoryId");
    setSearchParams(params);
  };

  return (
    <>
      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <nav className="breadcrumb bg-light mb-30">
              <Link className="breadcrumb-item text-dark" to="/">Home</Link>
              <span className="breadcrumb-item active">Shop</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-lg-3 col-md-4">
            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pr-3">Categories</span>
            </h5>
            <div className="bg-light p-4 mb-30">
              <div className="custom-control custom-radio d-flex align-items-center justify-content-between mb-3">
                <input
                  type="radio"
                  className="custom-control-input"
                  id="category-all"
                  checked={!categoryId}
                  onChange={() => updateCategory("")}
                />
                <label className="custom-control-label" htmlFor="category-all">All Categories</label>
                <span className="badge border font-weight-normal">{products.length}</span>
              </div>
              {categories.map((category) => (
                <div key={category.id} className="custom-control custom-radio d-flex align-items-center justify-content-between mb-3">
                  <input
                    type="radio"
                    className="custom-control-input"
                    id={`category-${category.id}`}
                    checked={Number(categoryId) === Number(category.id)}
                    onChange={() => updateCategory(String(category.id))}
                  />
                  <label className="custom-control-label" htmlFor={`category-${category.id}`}>{category.name}</label>
                  <span className="badge border font-weight-normal">
                    {products.filter((product) => getProductCategoryName(product, categories) === category.name).length}
                  </span>
                </div>
              ))}
            </div>

            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pr-3">Filter by price</span>
            </h5>
            <div className="bg-light p-4 mb-30">
              {priceRanges.map((range, index) => (
                <div key={range.label} className="custom-control custom-radio d-flex align-items-center justify-content-between mb-3">
                  <input
                    type="radio"
                    className="custom-control-input"
                    id={`price-${index}`}
                    checked={priceIndex === index}
                    onChange={() => setPriceIndex(index)}
                  />
                  <label className="custom-control-label" htmlFor={`price-${index}`}>{range.label}</label>
                  <span className="badge border font-weight-normal">
                    {range.max === Infinity ? "" : formatCurrency(range.max)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-9 col-md-8">
            <div className="row pb-3">
              <div className="col-12 pb-1">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <button type="button" className="btn btn-sm btn-light"><i className="fa fa-th-large"></i></button>
                    <button type="button" className="btn btn-sm btn-light ml-2"><i className="fa fa-bars"></i></button>
                  </div>
                  <div className="d-flex align-items-center">
                    <small className="text-muted mr-3">{visibleProducts.length} products</small>
                    <select className="custom-select custom-select-sm" value={sort} onChange={(event) => setSort(event.target.value)}>
                      <option value="latest">Latest</option>
                      <option value="name">Name</option>
                      <option value="price-asc">Price low to high</option>
                      <option value="price-desc">Price high to low</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="col-12 text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="col-12">
                  <div className="alert alert-warning">{error}</div>
                </div>
              ) : visibleProducts.length === 0 ? (
                <div className="col-12">
                  <div className="bg-light p-5 text-center">
                    <h5>No products found</h5>
                    <p className="mb-0">Try another category, keyword or price range.</p>
                  </div>
                </div>
              ) : (
                visibleProducts.map((product) => (
                  <div key={product.id} className="col-lg-4 col-md-6 col-sm-6 pb-1">
                    <ProductCard product={product} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Shop;

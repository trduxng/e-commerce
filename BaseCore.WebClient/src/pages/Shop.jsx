import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { categoryApi, productApi } from "../services/api";
import {
  formatCurrency,
  normalizeProductList,
} from "../data/shopData";

const pageSize = 9;

const normalizePrice = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? String(number) : "";
};

const buildPageItems = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 3);
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
  }

  return [...pages]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((first, second) => first - second)
    .reduce((items, pageNumber) => {
      const previous = items[items.length - 1];
      if (previous && pageNumber - previous > 1) items.push("ellipsis");
      items.push(pageNumber);
      return items;
    }, []);
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("latest");
  const [priceDraft, setPriceDraft] = useState({ min: "", max: "" });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const keyword = searchParams.get("keyword") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const minPrice = normalizePrice(searchParams.get("minPrice"));
  const maxPrice = normalizePrice(searchParams.get("maxPrice"));
  const requestedPage = Number(searchParams.get("page") || 1);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const hasPriceFilter = Boolean(minPrice || maxPrice);
  const draftMinPrice = normalizePrice(priceDraft.min);
  const draftMaxPrice = normalizePrice(priceDraft.max);
  const priceError =
    draftMinPrice && draftMaxPrice && Number(draftMinPrice) > Number(draftMaxPrice)
      ? "Minimum price must be less than or equal to maximum price."
      : "";

  useEffect(() => {
    setPriceDraft({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const loadShop = async () => {
      setLoading(true);
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          categoryApi.getAll(),
          productApi.search({
            keyword: keyword || undefined,
            categoryId: categoryId || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            page,
            pageSize,
          }),
        ]);

        const apiCategories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
        const apiProducts = normalizeProductList(productsResponse.data);

        setCategories(apiCategories);
        setProducts(apiProducts);
        setTotalCount(Number(productsResponse.data?.totalCount ?? apiProducts.length));
        setTotalPages(Number(productsResponse.data?.totalPages ?? Math.ceil(apiProducts.length / pageSize)));
        setError("");
      } catch {
        setCategories([]);
        setProducts([]);
        setTotalCount(0);
        setTotalPages(0);
        setError("Cannot load products from database. Please start ApiGateway and APIService.");
      } finally {
        setLoading(false);
      }
    };

    loadShop();
  }, [keyword, categoryId, minPrice, maxPrice, page]);

  const visibleProducts = useMemo(() => {
    return [...products].sort((first, second) => {
      if (sort === "price-asc") return Number(first.price || 0) - Number(second.price || 0);
      if (sort === "price-desc") return Number(second.price || 0) - Number(first.price || 0);
      if (sort === "name") return first.name.localeCompare(second.name);
      return Number(second.id || 0) - Number(first.id || 0);
    });
  }, [products, sort]);

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") params.delete(key);
      else params.set(key, String(value));
    });
    setSearchParams(params);
  };

  const updateCategory = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("categoryId", value);
    else params.delete("categoryId");
    params.set("page", "1");
    setSearchParams(params);
  };

  const applyPriceFilter = (event) => {
    event.preventDefault();
    const nextMin = draftMinPrice;
    const nextMax = draftMaxPrice;

    if (nextMin && nextMax && Number(nextMin) > Number(nextMax)) return;

    updateParams({
      minPrice: nextMin,
      maxPrice: nextMax,
      page: 1,
    });
  };

  const clearPriceFilter = () => {
    setPriceDraft({ min: "", max: "" });
    updateParams({ minPrice: "", maxPrice: "", page: 1 });
  };

  const changePage = (nextPage) => {
    const safePage = Math.min(Math.max(1, nextPage), Math.max(totalPages, 1));
    updateParams({ page: safePage });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="col-12">
        <div className="shop-pagination d-flex flex-column flex-md-row align-items-md-center justify-content-between">
          <span className="shop-page-summary">
            Page {page} of {totalPages} • {totalCount} products
          </span>
          <nav aria-label="Shop pagination">
            <ul className="pagination mb-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" type="button" onClick={() => changePage(page - 1)}>
                  <i className="fa fa-chevron-left mr-1"></i>
                  Previous
                </button>
              </li>
              {buildPageItems(page, totalPages).map((pageItem, index) =>
                pageItem === "ellipsis" ? (
                  <li key={`ellipsis-${index}`} className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                ) : (
                  <li key={pageItem} className={`page-item ${page === pageItem ? "active" : ""}`}>
                    <button className="page-link" type="button" onClick={() => changePage(pageItem)}>
                      {pageItem}
                    </button>
                  </li>
                )
              )}
              <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                <button className="page-link" type="button" onClick={() => changePage(page + 1)}>
                  Next
                  <i className="fa fa-chevron-right ml-1"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    );
  };

  return (
    <div className="shop-page">
      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <nav className="breadcrumb shop-breadcrumb bg-light mb-30">
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
            <div className="shop-filter-panel bg-light p-4 mb-30">
              <div className="custom-control custom-radio d-flex align-items-center justify-content-between mb-3">
                <input
                  type="radio"
                  className="custom-control-input"
                  id="category-all"
                  checked={!categoryId}
                  onChange={() => updateCategory("")}
                />
                <label className="custom-control-label" htmlFor="category-all">All Categories</label>
                <span className="badge border font-weight-normal">{!categoryId ? totalCount : ""}</span>
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
                  <span className="badge border font-weight-normal">{Number(categoryId) === Number(category.id) ? totalCount : ""}</span>
                </div>
              ))}
            </div>

            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pr-3">Filter by price</span>
            </h5>
            <form className="shop-filter-panel bg-light p-4 mb-30" onSubmit={applyPriceFilter}>
              <div className="form-group">
                <label className="shop-filter-label" htmlFor="min-price">Minimum price</label>
                <div className="input-group">
                  <input
                    id="min-price"
                    type="number"
                    min="0"
                    step="1000"
                    className="form-control"
                    placeholder="0"
                    value={priceDraft.min}
                    onChange={(event) => setPriceDraft((current) => ({ ...current, min: event.target.value }))}
                  />
                  <div className="input-group-append">
                    <span className="input-group-text">VND</span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="shop-filter-label" htmlFor="max-price">Maximum price</label>
                <div className="input-group">
                  <input
                    id="max-price"
                    type="number"
                    min="0"
                    step="1000"
                    className="form-control"
                    placeholder="No limit"
                    value={priceDraft.max}
                    onChange={(event) => setPriceDraft((current) => ({ ...current, max: event.target.value }))}
                  />
                  <div className="input-group-append">
                    <span className="input-group-text">VND</span>
                  </div>
                </div>
              </div>
              {priceError && <div className="text-danger small mb-3">{priceError}</div>}
              {hasPriceFilter && (
                <div className="shop-active-filter mb-3">
                  {minPrice ? formatCurrency(minPrice) : "0 VND"} - {maxPrice ? formatCurrency(maxPrice) : "No limit"}
                </div>
              )}
              <div className="d-flex">
                <button className="btn btn-primary flex-fill" type="submit" disabled={Boolean(priceError)}>
                  Apply
                </button>
                <button className="btn btn-outline-dark ml-2" type="button" onClick={clearPriceFilter}>
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div className="col-lg-9 col-md-8">
            <div className="row pb-3">
              <div className="col-12 pb-1">
                <div className="shop-toolbar d-flex flex-column flex-lg-row align-items-lg-center justify-content-between mb-4">
                  <div>
                    <h4 className="mb-1">Product catalog</h4>
                    <small className="text-muted">
                      {loading ? "Loading products..." : `${totalCount} products available`}
                    </small>
                  </div>
                  <div className="shop-sort d-flex align-items-center mt-3 mt-lg-0">
                    <span className="text-muted mr-2">Sort by</span>
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
                  <div className="shop-empty-state bg-light p-5 text-center">
                    <h5>No products found</h5>
                    <p className="mb-0">Try another category, keyword or price range.</p>
                  </div>
                </div>
              ) : (
                <>
                  {visibleProducts.map((product) => (
                    <div key={product.id} className="col-lg-4 col-md-6 col-sm-6 pb-1">
                      <ProductCard product={product} />
                    </div>
                  ))}
                  {renderPagination()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;

import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductSkeletonGrid from "../components/ProductSkeletonGrid";
import { categoryApi, productApi, manufacturerApi, specificationAttributeApi } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import {
  formatCurrency,
  getProductOldPrice,
  getProductPrice,
  getProductRating,
  normalizeCategoryList,
  normalizeProductList,
  sampleCategories,
  sampleProducts,
} from "../data/shopData";

const pageSize = 9;

const normalizeManufacturerList = (data) => {
    if (!data) return [];
    const items = data.items || data;
    return Array.isArray(items) ? items : [];
};

const normalizeSpecList = (data) => Array.isArray(data) ? data : [];

const normalizePrice = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? String(number) : "";
};

const buildPageItems = (currentPage, totalPages) => {
  // Chỉ hiển thị các trang gần trang hiện tại và chèn dấu ... cho khoảng bị rút gọn.
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
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [specAttributes, setSpecAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("latest");
  const [priceDraft, setPriceDraft] = useState({ min: "", max: "" });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const keyword = searchParams.get("keyword") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const manufacturerId = searchParams.get("manufacturerId") || "";
  const minPrice = normalizePrice(searchParams.get("minPrice"));
  const maxPrice = normalizePrice(searchParams.get("maxPrice"));
  const requestedPage = Number(searchParams.get("page") || 1);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const hasPriceFilter = Boolean(minPrice || maxPrice);
  const draftMinPrice = normalizePrice(priceDraft.min);
  const draftMaxPrice = normalizePrice(priceDraft.max);
  const priceError =
    draftMinPrice && draftMaxPrice && Number(draftMinPrice) > Number(draftMaxPrice)
      ? "Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa."
      : "";

  useEffect(() => {
    // Đồng bộ ô nhập giá với URL để nút Back/Forward của trình duyệt hoạt động đúng.
    setPriceDraft({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const loadShop = async () => {
      setLoading(true);
      try {
        const specFilters = {};
        searchParams.forEach((value, key) => {
            if (key.startsWith('s_')) specFilters[key] = value;
        });

        // Tải metadata bộ lọc và danh sách sản phẩm song song để giảm thời gian chờ.
        const [categoriesResponse, manufacturersResponse, specAttrResponse, productsResponse] = await Promise.all([
          categoryApi.getAll(),
          manufacturerApi.getAll({ pageSize: 100 }),
          specificationAttributeApi.getAll(),
          productApi.search({
            publishedId: 1,
            keyword: keyword || undefined,
            categoryId: categoryId || undefined,
            manufacturerId: manufacturerId || undefined,
            ...specFilters,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            page,
            pageSize,
          }),
        ]);

        const apiCategories = normalizeCategoryList(categoriesResponse.data);
        const apiManufacturers = normalizeManufacturerList(manufacturersResponse.data);
        const apiSpecAttrs = normalizeSpecList(specAttrResponse.data);
        const apiProducts = normalizeProductList(productsResponse.data);
        
        setCategories(apiCategories.length > 0 ? apiCategories : sampleCategories);
        setManufacturers(apiManufacturers);
        setSpecAttributes(apiSpecAttrs);
        setProducts(apiProducts.filter((product) => product.isActive !== false));
        
        const apiTotalCount = Number(productsResponse.data?.totalCount);
        const apiTotalPages = Number(productsResponse.data?.totalPages);
        setTotalCount(Number.isFinite(apiTotalCount) ? apiTotalCount : apiProducts.length);
        setTotalPages(Number.isFinite(apiTotalPages) ? apiTotalPages : Math.ceil(apiProducts.length / pageSize));
        setError("");
      } catch {
        // Dùng dữ liệu mẫu để trang vẫn sử dụng được khi API tạm thời không kết nối.
        const filteredProducts = sampleProducts.filter((product) => {
          const productName = String(product.name || "").toLowerCase();
          const productDescription = String(product.description || "").toLowerCase();
          const productPrice = getProductPrice(product);
          const matchesKeyword = !keyword || productName.includes(keyword.toLowerCase()) || productDescription.includes(keyword.toLowerCase());
          const matchesCategory = !categoryId || Number(product.categoryId) === Number(categoryId);
          const matchesMin = !minPrice || productPrice >= Number(minPrice);
          const matchesMax = !maxPrice || productPrice <= Number(maxPrice);
          return matchesKeyword && matchesCategory && matchesMin && matchesMax;
        });
        const startIndex = (page - 1) * pageSize;

        setCategories(sampleCategories);
        setProducts(filteredProducts.slice(startIndex, startIndex + pageSize));
        setTotalCount(filteredProducts.length);
        setTotalPages(Math.ceil(filteredProducts.length / pageSize));
        setError("Không thể kết nối API, danh mục đang hiển thị sản phẩm mẫu.");
        toast.warning("Không thể kết nối API, danh mục đang hiển thị sản phẩm mẫu.", {
          dedupeKey: "shop-api-fallback",
        });
      } finally {
        setLoading(false);
      }
    };

    loadShop();
  }, [keyword, categoryId, manufacturerId, searchParams, minPrice, maxPrice, page, toast]);

  const visibleProducts = useMemo(() => {
    // Sort phía client chỉ áp dụng trên trang sản phẩm hiện tại đã nhận từ server.
    return [...products].sort((first, second) => {
      if (sort === "price-asc") return getProductPrice(first) - getProductPrice(second);
      if (sort === "price-desc") return getProductPrice(second) - getProductPrice(first);
      if (sort === "rating") return getProductRating(second) - getProductRating(first);
      if (sort === "best-selling") return Number(second.soldCount || 0) - Number(first.soldCount || 0);
      if (sort === "sale") return Number(Boolean(getProductOldPrice(second))) - Number(Boolean(getProductOldPrice(first)));
      if (sort === "name") return first.name.localeCompare(second.name);
      return Number(second.id || 0) - Number(first.id || 0);
    });
  }, [products, sort]);

  const updateParams = (updates) => {
    // URL là nguồn trạng thái cho bộ lọc/phân trang, giúp chia sẻ hoặc tải lại đúng kết quả.
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

  const updateManufacturer = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("manufacturerId", value);
    else params.delete("manufacturerId");
    params.set("page", "1");
    setSearchParams(params);
  };

  const updateSpecification = (attrId, value) => {
    // Mỗi thuộc tính được lưu dạng s_{id}=value1,value2 để backend dựng specificationFilters.
    const params = new URLSearchParams(searchParams);
    const key = `s_${attrId}`;
    const currentValues = params.get(key)?.split(',') || [];
    
    let nextValues;
    if (currentValues.includes(value)) {
        nextValues = currentValues.filter(v => v !== value);
    } else {
        nextValues = [...currentValues, value];
    }

    if (nextValues.length > 0) params.set(key, nextValues.join(','));
    else params.delete(key);
    
    params.set("page", "1");
    setSearchParams(params);
  };

  const isSpecSelected = (attrId, value) => {
    const key = `s_${attrId}`;
    return searchParams.get(key)?.split(',').includes(value) || false;
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
            Trang {page}/{totalPages} - {totalCount} sản phẩm
          </span>
          <nav aria-label="Phân trang cửa hàng">
            <ul className="pagination mb-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" type="button" onClick={() => changePage(page - 1)}>
                  <i className="fa fa-chevron-left me-1"></i>
                  Trước
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
                  Sau
                  <i className="fa fa-chevron-right ms-1"></i>
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
              <Link className="breadcrumb-item text-dark" to="/">Trang chủ</Link>
              <span className="breadcrumb-item active">Cửa hàng</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-lg-3 col-md-4">
            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pe-3">Danh mục</span>
            </h5>
            <div className="shop-filter-panel bg-light p-4 mb-30">
              <div className="shop-filter-option">
                <input
                  type="radio"
                  className="form-check-input shop-filter-radio"
                  id="category-all"
                  checked={!categoryId}
                  onChange={() => updateCategory("")}
                />
                <label className="shop-filter-option-label" htmlFor="category-all">Tất cả danh mục</label>
                <span className="badge border fw-normal">{!categoryId ? totalCount : ""}</span>
              </div>
              {categories.map((category) => (
                <div key={category.id} className="shop-filter-option">
                  <input
                    type="radio"
                    className="form-check-input shop-filter-radio"
                    id={`category-${category.id}`}
                    checked={Number(categoryId) === Number(category.id)}
                    onChange={() => updateCategory(String(category.id))}
                  />
                  <label className="shop-filter-option-label" htmlFor={`category-${category.id}`}>{category.name}</label>
                  <span className="badge border fw-normal">{Number(categoryId) === Number(category.id) ? totalCount : ""}</span>
                </div>
              ))}
            </div>

            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pe-3">Thương hiệu</span>
            </h5>
            <div className="shop-filter-panel bg-light p-4 mb-30">
              <div className="shop-filter-option">
                <input
                  type="radio"
                  className="form-check-input shop-filter-radio"
                  id="brand-all"
                  checked={!manufacturerId}
                  onChange={() => updateManufacturer("")}
                />
                <label className="shop-filter-option-label" htmlFor="brand-all">Tất cả thương hiệu</label>
                <span className="badge border fw-normal">{!manufacturerId ? totalCount : ""}</span>
              </div>
              {manufacturers.map((brand) => (
                <div key={brand.id} className="shop-filter-option">
                  <input
                    type="radio"
                    className="form-check-input shop-filter-radio"
                    id={`brand-${brand.id}`}
                    checked={Number(manufacturerId) === Number(brand.id)}
                    onChange={() => updateManufacturer(String(brand.id))}
                  />
                  <label className="shop-filter-option-label" htmlFor={`brand-${brand.id}`}>{brand.name}</label>
                  <span className="badge border fw-normal">{Number(manufacturerId) === Number(brand.id) ? totalCount : ""}</span>
                </div>
              ))}
            </div>

            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pe-3">Lọc theo giá</span>
            </h5>
            <form className="shop-filter-panel bg-light p-4 mb-30" onSubmit={applyPriceFilter}>
              <div className="form-group">
                <label className="shop-filter-label" htmlFor="min-price">Giá tối thiểu</label>
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
                  <span className="input-group-text">VND</span>
                </div>
              </div>
              <div className="form-group">
                <label className="shop-filter-label" htmlFor="max-price">Giá tối đa</label>
                <div className="input-group">
                  <input
                    id="max-price"
                    type="number"
                    min="0"
                    step="1000"
                    className="form-control"
                    placeholder="Không giới hạn"
                    value={priceDraft.max}
                    onChange={(event) => setPriceDraft((current) => ({ ...current, max: event.target.value }))}
                  />
                  <span className="input-group-text">VND</span>
                </div>
              </div>
              {priceError && <div className="text-danger small mb-3">{priceError}</div>}
              {hasPriceFilter && (
                <div className="shop-active-filter mb-3">
                  {minPrice ? formatCurrency(minPrice) : "0 VND"} - {maxPrice ? formatCurrency(maxPrice) : "Không giới hạn"}
                </div>
              )}
              <div className="d-flex">
                <button className="btn btn-primary flex-fill" type="submit" disabled={Boolean(priceError)}>
                  Áp dụng
                </button>
                <button className="btn btn-outline-dark ms-2" type="button" onClick={clearPriceFilter}>
                  Xóa lọc
                </button>
              </div>
            </form>

            {specAttributes.map(attr => {
                const uniqueValues = Array.from(new Set(
                    products.flatMap(p => 
                        (p.productSpecifications || [])
                        .filter(ps => ps.specificationAttributeId === attr.id)
                        .map(ps => ps.value)
                    )
                )).filter(Boolean).sort();

                if (uniqueValues.length === 0) return null;

                return (
                    <React.Fragment key={attr.id}>
                        <h5 className="section-title position-relative text-uppercase mb-3">
                            <span className="bg-secondary pe-3">{attr.name}</span>
                        </h5>
                        <div className="shop-filter-panel bg-light p-4 mb-30">
                            {uniqueValues.map(val => (
                                <div key={val} className="shop-filter-option">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id={`spec-${attr.id}-${val}`}
                                        checked={isSpecSelected(attr.id, val)}
                                        onChange={() => updateSpecification(attr.id, val)}
                                    />
                                    <label className="shop-filter-option-label" htmlFor={`spec-${attr.id}-${val}`}>{val}</label>
                                </div>
                            ))}
                        </div>
                    </React.Fragment>
                );
            })}
          </div>

          <div className="col-lg-9 col-md-8">
            <div className="row pb-3">
              <div className="col-12 pb-1">
                <div className="shop-toolbar d-flex flex-column flex-lg-row align-items-lg-center justify-content-between mb-4">
                  <div>
                    <h4 className="mb-1">Danh mục sản phẩm</h4>
                    <small className="text-muted">
                      {loading ? "Đang tải sản phẩm..." : `${totalCount} sản phẩm hiện có`}
                    </small>
                    {error && <small className="shop-demo-note d-block">{error}</small>}
                  </div>
                  <div className="shop-sort d-flex align-items-center mt-3 mt-lg-0">
                    <span className="text-muted me-2">Sắp xếp theo</span>
                    <select className="form-select form-select-sm" value={sort} onChange={(event) => setSort(event.target.value)}>
                      <option value="latest">Mới nhất</option>
                      <option value="best-selling">Bán chạy nhất</option>
                      <option value="rating">Đánh giá cao nhất</option>
                      <option value="sale">Đang giảm giá</option>
                      <option value="name">Tên sản phẩm</option>
                      <option value="price-asc">Giá từ thấp đến cao</option>
                      <option value="price-desc">Giá từ cao đến thấp</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <ProductSkeletonGrid count={6} />
              ) : visibleProducts.length === 0 ? (
                <div className="col-12">
                  <div className="shop-empty-state bg-light p-5 text-center">
                    <h5>Không tìm thấy sản phẩm</h5>
                    <p className="mb-0">Hãy thử danh mục, từ khóa hoặc khoảng giá khác.</p>
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

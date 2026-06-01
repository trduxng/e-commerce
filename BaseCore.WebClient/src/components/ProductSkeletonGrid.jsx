import React from "react";

const ProductSkeletonGrid = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
        <div className="product-skeleton" aria-hidden="true">
          <div className="skeleton-block skeleton-image"></div>
          <div className="skeleton-block skeleton-line"></div>
          <div className="skeleton-block skeleton-line skeleton-line-short"></div>
        </div>
      </div>
    ))}
  </>
);

export default ProductSkeletonGrid;

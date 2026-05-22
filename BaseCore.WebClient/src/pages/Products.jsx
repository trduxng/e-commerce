import React, { useEffect, useState } from 'react';
import { productApi, categoryApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getProductImage } from '../data/shopData';

const createEmptyVariant = (overrides = {}) => ({
    id: null,
    sku: `SKU-${Date.now()}`,
    price: '',
    salePrice: '',
    stockQuantity: '',
    size: '',
    color: '',
    imageUrl: '',
    isActive: true,
    ...overrides,
});

const emptyForm = {
    name: '',
    shortDescription: '',
    description: '',
    imageUrl: '',
    categoryId: '',
    price: '',
    salePrice: '',
    stock: '',
    sku: '',
    size: '',
    color: '',
    isActive: true,
    isFeatured: false,
    variants: [createEmptyVariant()],
};

const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.value)) return data.value;
    if (Array.isArray(data?.$values)) return data.$values;
    return [];
};

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [error, setError] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    const { isAdmin } = useAuth();

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [page, keyword, categoryId]);

    const firstVariant = (product) => product?.productVariants?.[0] || {};

    const getVariantPreviewImage = (variant, fallback = '') =>
        variant?.imageUrl || fallback || '/img/product-1.jpg';

    const loadCategories = async () => {
        try {
            setCategoryError('');
            const response = await categoryApi.getAll();
            const items = normalizeList(response.data);

            if (items.length === 0) {
                setCategories([]);
                const message = 'No categories found. Add a category first before creating products.';
                setCategoryError(message);
                return [];
            }

            setCategories(items);
            return items;
        } catch (error) {
            console.error('Failed to load categories:', error);
            const message = error.response?.data?.message || 'Failed to load categories. Check that ApiGateway and APIService are running.';
            setCategories([]);
            setCategoryError(message);
            setError(message);
            return [];
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await productApi.search({
                keyword,
                categoryId: categoryId || undefined,
                page,
                pageSize,
            });
            const items = Array.isArray(response.data?.items)
                ? response.data.items
                : normalizeList(response.data);

            if (!Array.isArray(response.data?.items) && !Array.isArray(response.data?.data) && !Array.isArray(response.data)) {
                setError('Products API did not return a valid list. Check that ApiGateway and APIService are running.');
            }

            setProducts(items);
            setTotalPages(Number(response.data?.totalPages) || 0);
            setTotalCount(Number(response.data?.totalCount) || items.length);
        } catch (error) {
            console.error('Failed to load products:', error);
            setProducts([]);
            setError(error.response?.data?.message || 'Failed to load products. Check that ApiGateway and APIService are running.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(1);
        loadProducts();
    };

    const setField = (name, value) => {
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const setVariantField = (index, name, value) => {
        setFormData((current) => ({
            ...current,
            variants: current.variants.map((variant, variantIndex) =>
                variantIndex === index ? { ...variant, [name]: value } : variant
            ),
        }));
    };

    const addVariant = () => {
        setFormData((current) => ({
            ...current,
            variants: [
                ...current.variants,
                createEmptyVariant({
                    sku: `SKU-${Date.now()}-${current.variants.length + 1}`,
                    price: current.variants[0]?.price || current.price || '',
                }),
            ],
        }));
    };

    const removeVariant = (index) => {
        setFormData((current) => {
            if (current.variants.length <= 1) return current;
            return {
                ...current,
                variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
            };
        });
    };

    const handleCreateCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) {
            setCategoryError('Enter a category name first.');
            return;
        }

        setSavingCategory(true);
        setCategoryError('');

        try {
            const response = await categoryApi.create({
                name,
                description: '',
                isActive: true,
            });
            const createdCategory = response.data;
            const updatedCategories = [...categories, createdCategory];
            setCategories(updatedCategories);
            setField('categoryId', String(createdCategory.id));
            setNewCategoryName('');
        } catch (error) {
            console.error('Failed to create category:', error);
            setCategoryError(error.response?.data?.message || 'Failed to create category.');
        } finally {
            setSavingCategory(false);
        }
    };

    const openModal = async (product = null) => {
        setError('');
        const availableCategories = categories.length > 0 ? categories : await loadCategories();

        if (product) {
            let fullProduct = product;
            try {
                const response = await productApi.getById(product.id);
                fullProduct = response.data;
            } catch {
                fullProduct = product;
            }

            const variants = Array.isArray(fullProduct.productVariants) && fullProduct.productVariants.length > 0
                ? fullProduct.productVariants.map((variant) => ({
                    id: variant.id ?? null,
                    sku: variant.sku || '',
                    price: variant.price ?? fullProduct.price ?? '',
                    salePrice: variant.salePrice ?? '',
                    stockQuantity: variant.stockQuantity ?? variant.stock ?? '',
                    size: variant.size || '',
                    color: variant.color || '',
                    imageUrl: variant.imageUrl || '',
                    isActive: variant.isActive !== false,
                }))
                : [createEmptyVariant({
                    price: fullProduct.price ?? '',
                    stockQuantity: fullProduct.stock ?? '',
                    imageUrl: fullProduct.imageUrl || '',
                })];
            const variant = variants[0] || {};
            const selectedCategoryId = fullProduct.categoryId ?? fullProduct.category?.id ?? '';
            setEditingProduct(fullProduct);
            setFormData({
                name: fullProduct.name || '',
                shortDescription: fullProduct.shortDescription || '',
                description: fullProduct.description || '',
                imageUrl: fullProduct.imageUrl || '',
                categoryId: selectedCategoryId === '' ? '' : String(selectedCategoryId),
                price: variant.price ?? '',
                salePrice: variant.salePrice ?? '',
                stock: variant.stockQuantity ?? '',
                sku: variant.sku || '',
                size: variant.size || '',
                color: variant.color || '',
                isActive: fullProduct.isActive !== false,
                isFeatured: Boolean(fullProduct.isFeatured),
                variants,
            });
        } else {
            setEditingProduct(null);
            setFormData({
                ...emptyForm,
                categoryId: availableCategories[0]?.id ? String(availableCategories[0].id) : '',
                sku: `SKU-${Date.now()}`,
                variants: [createEmptyVariant({ sku: `SKU-${Date.now()}` })],
            });
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!formData.categoryId) {
            setError('Please select a category.');
            return;
        }

        if (formData.variants.length === 0) {
            setError('Add at least one product variant.');
            return;
        }

        const normalizedVariants = [];
        const skuSet = new Set();

        for (let index = 0; index < formData.variants.length; index += 1) {
            const variant = formData.variants[index];
            const price = Number(variant.price);
            const stockQuantity = Number(variant.stockQuantity);
            const salePrice = variant.salePrice === '' ? null : Number(variant.salePrice);
            const sku = variant.sku.trim();

            if (!Number.isFinite(price) || price <= 0) {
                setError(`Variant #${index + 1} price must be greater than zero.`);
                return;
            }

            if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
                setError(`Variant #${index + 1} stock must be zero or greater.`);
                return;
            }

            if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) {
                setError(`Variant #${index + 1} sale price must be between zero and the regular price.`);
                return;
            }

            if (sku) {
                const skuKey = sku.toLowerCase();
                if (skuSet.has(skuKey)) {
                    setError(`SKU ${sku} is duplicated.`);
                    return;
                }
                skuSet.add(skuKey);
            }

            normalizedVariants.push({
                id: variant.id || undefined,
                sku,
                price,
                salePrice,
                stockQuantity,
                size: variant.size.trim(),
                color: variant.color.trim(),
                imageUrl: variant.imageUrl.trim(),
                isActive: variant.isActive,
            });
        }

        if (formData.isActive && !normalizedVariants.some((variant) => variant.isActive)) {
            setError('At least one variant must be active while this product is selling.');
            return;
        }

        try {
            const visibleVariants = normalizedVariants.filter((variant) => variant.isActive);
            const priceSource = visibleVariants.length > 0 ? visibleVariants : normalizedVariants;
            const basePrice = Math.min(...priceSource.map((variant) => variant.salePrice ?? variant.price));
            const firstVariant = normalizedVariants[0];
            const data = {
                name: formData.name.trim(),
                categoryId: Number(formData.categoryId),
                shortDescription: formData.shortDescription.trim(),
                description: formData.description.trim(),
                imageUrl: formData.imageUrl.trim(),
                price: basePrice,
                salePrice: firstVariant.salePrice,
                stock: normalizedVariants.reduce((sum, variant) => sum + variant.stockQuantity, 0),
                sku: firstVariant.sku,
                size: firstVariant.size,
                color: firstVariant.color,
                variants: normalizedVariants,
                isActive: formData.isActive,
                isFeatured: formData.isFeatured,
            };

            if (editingProduct) {
                await productApi.update(editingProduct.id, data);
            } else {
                await productApi.create(data);
            }

            closeModal();
            loadProducts();
        } catch (error) {
            setError(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to stop selling this product?')) return;

        try {
            await productApi.delete(id);
            loadProducts();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update product');
        }
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                    <button className="page-link" type="button" onClick={() => setPage(i)}>{i}</button>
                </li>
            );
        }
        return pages;
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Products Management</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <div className="row">
                                <div className="col-md-8">
                                    <form onSubmit={handleSearch} className="form-inline">
                                        <input
                                            type="text"
                                            className="form-control mr-2"
                                            placeholder="Search products"
                                            value={keyword}
                                            onChange={(event) => setKeyword(event.target.value)}
                                        />
                                        <select
                                            className="form-control mr-2"
                                            value={categoryId}
                                            onChange={(event) => {
                                                setCategoryId(event.target.value);
                                                setPage(1);
                                            }}
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={String(category.id)}>{category.name}</option>
                                            ))}
                                        </select>
                                        <button type="submit" className="btn btn-primary">
                                            <i className="fas fa-search"></i> Search
                                        </button>
                                    </form>
                                </div>
                                <div className="col-md-4 text-right">
                                    {isAdmin() && (
                                        <button className="btn btn-success" type="button" onClick={() => openModal()}>
                                            <i className="fas fa-plus"></i> Add Product
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {error && !showModal && <div className="alert alert-warning">{error}</div>}
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-striped">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '90px' }}>Image</th>
                                                    <th>Name</th>
                                                    <th>Category</th>
                                                    <th>SKU</th>
                                                    <th>Price</th>
                                                    <th>Stock</th>
                                                    <th>Status</th>
                                                    {isAdmin() && <th style={{ width: '130px' }}>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={isAdmin() ? 8 : 7} className="text-center">
                                                            No products found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    products.map((product) => {
                                                        const variant = firstVariant(product);
                                                        return (
                                                            <tr key={product.id}>
                                                                <td>
                                                                    <img
                                                                        src={getVariantPreviewImage(variant, getProductImage(product))}
                                                                        alt={product.name}
                                                                        style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <strong>{product.name}</strong>
                                                                    {product.isFeatured && <span className="badge badge-primary ml-2">Featured</span>}
                                                                    <div className="text-muted small">{product.shortDescription}</div>
                                                                </td>
                                                                <td>{product.category?.name || ''}</td>
                                                                <td>{variant.sku || ''}</td>
                                                                <td>
                                                                    <div>{formatCurrency(variant.salePrice ?? product.price)}</div>
                                                                    {variant.salePrice && <small className="text-muted"><del>{formatCurrency(variant.price)}</del></small>}
                                                                </td>
                                                                <td>{product.stock}</td>
                                                                <td>
                                                                    <span className={`badge ${product.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                                                        {product.isActive ? 'Selling' : 'Hidden'}
                                                                    </span>
                                                                </td>
                                                                {isAdmin() && (
                                                                    <td>
                                                                        <button
                                                                            className="btn btn-sm btn-info mr-1"
                                                                            type="button"
                                                                            onClick={() => openModal(product)}
                                                                        >
                                                                            <i className="fas fa-edit"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm btn-danger"
                                                                            type="button"
                                                                            onClick={() => handleDelete(product.id)}
                                                                        >
                                                                            <i className="fas fa-ban"></i>
                                                                        </button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>Total: {totalCount} products</span>
                                        <nav>
                                            <ul className="pagination mb-0">
                                                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                    <button className="page-link" type="button" onClick={() => setPage(Math.max(1, page - 1))}>
                                                        Previous
                                                    </button>
                                                </li>
                                                {renderPagination()}
                                                <li className={`page-item ${page === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                                    <button className="page-link" type="button" onClick={() => setPage(page + 1)}>
                                                        Next
                                                    </button>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingProduct ? 'Edit Product' : 'Add Product'}
                                </h5>
                                <button type="button" className="close" onClick={closeModal}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    <div className="row">
                                        <div className="col-md-5">
                                            <h6 className="text-uppercase text-muted">Product Information</h6>
                                            <div className="form-group">
                                                <label>Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.name}
                                                    onChange={(event) => setField('name', event.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Category</label>
                                                <select
                                                    className="form-control"
                                                    value={String(formData.categoryId || '')}
                                                    onChange={(event) => setField('categoryId', event.target.value)}
                                                    required
                                                    disabled={categories.length === 0}
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={String(category.id)}>{category.name}</option>
                                                    ))}
                                                </select>
                                                {categoryError && <small className="text-danger">{categoryError}</small>}
                                                <div className="input-group mt-2">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={newCategoryName}
                                                        onChange={(event) => setNewCategoryName(event.target.value)}
                                                        placeholder="New category name"
                                                    />
                                                    <div className="input-group-append">
                                                        <button
                                                            className="btn btn-outline-primary"
                                                            type="button"
                                                            onClick={handleCreateCategory}
                                                            disabled={savingCategory}
                                                        >
                                                            {savingCategory ? 'Adding...' : 'Add Category'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Short Description</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.shortDescription}
                                                    onChange={(event) => setField('shortDescription', event.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Description</label>
                                                <textarea
                                                    className="form-control"
                                                    value={formData.description}
                                                    onChange={(event) => setField('description', event.target.value)}
                                                    rows="5"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Product Image URL</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.imageUrl}
                                                    onChange={(event) => setField('imageUrl', event.target.value)}
                                                    placeholder="/img/product-1.jpg or https://..."
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-7">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="text-uppercase text-muted mb-0">Variants</h6>
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addVariant}>
                                                    <i className="fas fa-plus"></i> Add Variant
                                                </button>
                                            </div>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered bg-white">
                                                    <thead>
                                                        <tr>
                                                            <th style={{ minWidth: '220px' }}>Image</th>
                                                            <th>Size</th>
                                                            <th>Color</th>
                                                            <th style={{ minWidth: '110px' }}>Price</th>
                                                            <th style={{ minWidth: '110px' }}>Sale</th>
                                                            <th style={{ minWidth: '92px' }}>Stock</th>
                                                            <th style={{ minWidth: '140px' }}>SKU</th>
                                                            <th>Status</th>
                                                            <th style={{ width: '44px' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formData.variants.map((variant, index) => (
                                                            <tr key={variant.id || `${variant.sku}-${index}`}>
                                                                <td>
                                                                    <div className="variant-image-cell">
                                                                        <img
                                                                            src={getVariantPreviewImage(variant, formData.imageUrl)}
                                                                            alt={`Variant ${index + 1}`}
                                                                            className="variant-image-preview"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            className="form-control form-control-sm"
                                                                            value={variant.imageUrl}
                                                                            onChange={(event) => setVariantField(index, 'imageUrl', event.target.value)}
                                                                            placeholder="/img/product-1.jpg"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={variant.size}
                                                                        onChange={(event) => setVariantField(index, 'size', event.target.value)}
                                                                        placeholder="M"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={variant.color}
                                                                        onChange={(event) => setVariantField(index, 'color', event.target.value)}
                                                                        placeholder="Black"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={variant.price}
                                                                        onChange={(event) => setVariantField(index, 'price', event.target.value)}
                                                                        min="1"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={variant.salePrice}
                                                                        onChange={(event) => setVariantField(index, 'salePrice', event.target.value)}
                                                                        min="0"
                                                                        placeholder="-"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={variant.stockQuantity}
                                                                        onChange={(event) => setVariantField(index, 'stockQuantity', event.target.value)}
                                                                        min="0"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={variant.sku}
                                                                        onChange={(event) => setVariantField(index, 'sku', event.target.value)}
                                                                        placeholder="Auto"
                                                                    />
                                                                </td>
                                                                <td className="text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={variant.isActive}
                                                                        onChange={(event) => setVariantField(index, 'isActive', event.target.checked)}
                                                                        aria-label="Variant active"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        disabled={formData.variants.length <= 1}
                                                                        onClick={() => removeVariant(index)}
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="form-group">
                                                <div className="custom-control custom-switch">
                                                    <input
                                                        type="checkbox"
                                                        className="custom-control-input"
                                                        id="product-active"
                                                        checked={formData.isActive}
                                                        onChange={(event) => setField('isActive', event.target.checked)}
                                                    />
                                                    <label className="custom-control-label" htmlFor="product-active">Show this product in the shop</label>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <div className="custom-control custom-switch">
                                                    <input
                                                        type="checkbox"
                                                        className="custom-control-input"
                                                        id="product-featured"
                                                        checked={formData.isFeatured}
                                                        onChange={(event) => setField('isFeatured', event.target.checked)}
                                                    />
                                                    <label className="custom-control-label" htmlFor="product-featured">Featured product</label>
                                                </div>
                                            </div>
                                            <div className="bg-light p-3">
                                                <div className="font-weight-bold mb-2">Preview</div>
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={getVariantPreviewImage(formData.variants[0], formData.imageUrl)}
                                                        alt="Preview"
                                                        style={{ width: '72px', height: '72px', objectFit: 'cover' }}
                                                        className="mr-3"
                                                    />
                                                    <div>
                                                        <div>{formData.name || 'Product name'}</div>
                                                        <div className="text-muted">{formatCurrency(formData.variants[0]?.salePrice || formData.variants[0]?.price)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingProduct ? 'Update Product' : 'Create Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default Products;

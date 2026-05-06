import React, { useEffect, useState } from 'react';
import { productApi, categoryApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getProductImage } from '../data/shopData';

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
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const { isAdmin } = useAuth();

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [page, keyword, categoryId]);

    const firstVariant = (product) => product?.productVariants?.[0] || {};

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
        setImagePreviewUrl(null);
        const availableCategories = categories.length > 0 ? categories : await loadCategories();

        if (product) {
            let fullProduct = product;
            try {
                const response = await productApi.getById(product.id);
                fullProduct = response.data;
            } catch {
                fullProduct = product;
            }

            const variant = firstVariant(fullProduct);
            const selectedCategoryId = fullProduct.categoryId ?? fullProduct.category?.id ?? '';
            setEditingProduct(fullProduct);
            setFormData({
                name: fullProduct.name || '',
                shortDescription: fullProduct.shortDescription || '',
                description: fullProduct.description || '',
                imageUrl: fullProduct.imageUrl || '',
                categoryId: selectedCategoryId === '' ? '' : String(selectedCategoryId),
                price: variant.price ?? fullProduct.price ?? '',
                salePrice: variant.salePrice ?? '',
                stock: variant.stockQuantity ?? fullProduct.stock ?? '',
                sku: variant.sku || '',
                size: variant.size || '',
                color: variant.color || '',
                isActive: fullProduct.isActive !== false,
                isFeatured: Boolean(fullProduct.isFeatured),
            });
        } else {
            setEditingProduct(null);
            setFormData({
                ...emptyForm,
                categoryId: availableCategories[0]?.id ? String(availableCategories[0].id) : '',
                sku: `SKU-${Date.now()}`,
            });
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setError('');
        setImagePreviewUrl(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        const price = Number(formData.price);
        const stock = Number(formData.stock);
        const salePrice = formData.salePrice === '' ? null : Number(formData.salePrice);

        if (!formData.categoryId) {
            setError('Please select a category.');
            return;
        }

        if (!Number.isFinite(price) || price <= 0) {
            setError('Price must be greater than zero.');
            return;
        }

        if (!Number.isFinite(stock) || stock < 0) {
            setError('Stock must be zero or greater.');
            return;
        }

        if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) {
            setError('Sale price must be between zero and the regular price.');
            return;
        }

        try {
            const data = {
                name: formData.name?.trim() || '',
                categoryId: Number(formData.categoryId),
                shortDescription: formData.shortDescription?.trim() || '',
                description: formData.description?.trim() || '',
                imageUrl: formData.imageUrl?.trim() || '',
                price,
                salePrice,
                stock,
                sku: formData.sku?.trim() || '',
                size: formData.size?.trim() || '',
                color: formData.color?.trim() || '',
                isActive: Boolean(formData.isActive),
                isFeatured: Boolean(formData.isFeatured),
            };

            if (editingProduct) {
                await productApi.update(editingProduct.id, data);
            } else {
                await productApi.create(data);
            }

            closeModal();
            loadProducts();
        } catch (error) {
            console.error('Submit product error:', error);
            setError(error.response?.data?.message || error.message || 'Operation failed');
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

    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Tạo Data URL tạm để hiển thị hình ảnh trên Modal mà không bị vỡ.
        setImagePreviewUrl(URL.createObjectURL(file));

        // Fix lỗi "Operation failed": Database giới hạn ImageUrl 1000 ký tự.
        // Do chưa có API upload thật, ta giả lập đường dẫn tĩnh dựa trên tên file.
        const fakeUrl = `/img/${file.name}`;
        setField('imageUrl', fakeUrl);

        // Lưu bản Base64 vào bộ nhớ đệm LocalStorage để khi hiển thị list ngoài quản trị sẽ hiện được ảnh giả lập.
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                localStorage.setItem('img_' + fakeUrl, e.target.result);
            } catch (err) {
                console.warn('LocalStorage đầy hoặc không thể lưu ảnh tạm:', err);
            }
        };
        reader.readAsDataURL(file);
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
                                                                        src={getProductImage(product)}
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
                                        <div className="col-md-7">
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
                                                <label>Product Image</label>
                                                <div>
                                                    <input
                                                        type="file"
                                                        id="productImageInput"
                                                        accept="image/*, .webp, image/webp"
                                                        style={{ display: 'none' }}
                                                        onChange={handleImageSelect}
                                                    />
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={formData.imageUrl?.startsWith('data:image') ? 'Base64 Encoded Image' : formData.imageUrl}
                                                            onChange={(event) => setField('imageUrl', event.target.value)}
                                                            placeholder="/img/product-1.jpg or choose file"
                                                        />
                                                        <div className="input-group-append">
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => document.getElementById('productImageInput').click()}
                                                            >
                                                                <i className="fas fa-image"></i> Browse...
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-5">
                                            <h6 className="text-uppercase text-muted">Sales And Stock</h6>
                                            <div className="form-row">
                                                <div className="form-group col-md-6">
                                                    <label>Price</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formData.price}
                                                        onChange={(event) => setField('price', event.target.value)}
                                                        required
                                                        min="1"
                                                    />
                                                </div>
                                                <div className="form-group col-md-6">
                                                    <label>Sale Price</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formData.salePrice}
                                                        onChange={(event) => setField('salePrice', event.target.value)}
                                                        min="0"
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group col-md-6">
                                                    <label>Stock</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formData.stock}
                                                        onChange={(event) => setField('stock', event.target.value)}
                                                        required
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="form-group col-md-6">
                                                    <label>SKU</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.sku}
                                                        onChange={(event) => setField('sku', event.target.value)}
                                                        placeholder="Auto if empty"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group col-md-6">
                                                    <label>Size</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.size}
                                                        onChange={(event) => setField('size', event.target.value)}
                                                        placeholder="S, M, L..."
                                                    />
                                                </div>
                                                <div className="form-group col-md-6">
                                                    <label>Color</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.color}
                                                        onChange={(event) => setField('color', event.target.value)}
                                                        placeholder="Black, White..."
                                                    />
                                                </div>
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
                                                        src={imagePreviewUrl || formData.imageUrl || '/img/product-1.jpg'}
                                                        alt="Preview"
                                                        style={{ width: '72px', height: '72px', objectFit: 'cover' }}
                                                        className="mr-3"
                                                    />
                                                    <div>
                                                        <div>{formData.name || 'Product name'}</div>
                                                        <div className="text-muted">{formatCurrency(formData.salePrice || formData.price)}</div>
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

import React, { useEffect, useState } from 'react';
import { productApi, categoryApi, manufacturerApi, specificationAttributeApi } from '../services/api';
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
    manufacturerId: '',
    price: '',
    salePrice: '',
    stock: '',
    sku: '',
    size: '',
    color: '',
    isActive: true,
    isFeatured: false,
    variants: [createEmptyVariant()],
    specifications: [],
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
    const [manufacturers, setManufacturers] = useState([]);
    const [specAttributes, setSpecAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [sortField, setSortField] = useState('created');
    const [sortDir, setSortDir] = useState('desc');
    const [savingProduct, setSavingProduct] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalTab, setModalTab] = useState('info'); // 'info', 'variants', 'specs'
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [error, setError] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    const { isAdmin } = useAuth();

    useEffect(() => {
        loadCategories();
        loadManufacturers();
        loadSpecAttributes();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [page, keyword, categoryId, sortField, sortDir]);

    const firstVariant = (product) => product?.productVariants?.[0] || {};

    const getVariantPreviewImage = (variant, fallback = '') =>
        variant?.imageUrl || fallback || '/img/product-1.jpg';

    const loadSpecAttributes = async () => {
        try {
            const response = await specificationAttributeApi.getAll();
            setSpecAttributes(response.data || []);
        } catch (error) {
            console.error('Failed to load spec attributes:', error);
        }
    };

    const loadManufacturers = async () => {
        try {
            const response = await manufacturerApi.getAll({ pageSize: 100 });
            const items = normalizeList(response.data);
            setManufacturers(items);
            return items;
        } catch (error) {
            console.error('Failed to load manufacturers:', error);
            return [];
        }
    };

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
                categoryId: categoryId && categoryId !== '0' ? categoryId : undefined,
                searchIncludeSubCategories,
                manufacturerId: manufacturerId && manufacturerId !== '0' ? manufacturerId : undefined,
                publishedId: publishedId && publishedId !== '0' ? publishedId : undefined,
                goDirectlyToSku: goDirectlyToSku || undefined,
                sortField,
                sortDir,
                page,
                pageSize,
            });
            const items = Array.isArray(response.data?.items)
                ? response.data.items
                : normalizeList(response.data);

            setProducts(items);
            setTotalPages(Number(response.data?.totalPages) || 0);
            setTotalCount(Number(response.data?.totalCount) || items.length);
        } catch (error) {
            console.error('Failed to load products:', error);
            setProducts([]);
            setError(error.response?.data?.message || 'Failed to load products.');
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

    const setSpecField = (index, name, value) => {
        setFormData((current) => ({
            ...current,
            specifications: current.specifications.map((spec, specIndex) =>
                specIndex === index ? { ...spec, [name]: value } : spec
            ),
        }));
    };

    const addSpec = () => {
        setFormData((current) => ({
            ...current,
            specifications: [
                ...current.specifications,
                { attributeId: specAttributes[0]?.id || '', value: '', sortOrder: 0 },
            ],
        }));
    };

    const removeSpec = (index) => {
        setFormData((current) => ({
            ...current,
            specifications: current.specifications.filter((_, specIndex) => specIndex !== index),
        }));
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
        if (!name) return;
        setSavingCategory(true);
        try {
            const response = await categoryApi.create({ name, description: '', isActive: true });
            const createdCategory = response.data;
            setCategories([...categories, createdCategory]);
            setField('categoryId', String(createdCategory.id));
            setNewCategoryName('');
        } catch (error) {
            console.error('Failed to create category:', error);
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
                const response = await productApi.getById(product.id, { includeInactive: true });
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
            const selectedManufacturerId = fullProduct.manufacturerId ?? fullProduct.manufacturer?.id ?? '';
            
            const specs = Array.isArray(fullProduct.productSpecifications) 
                ? fullProduct.productSpecifications.map(s => ({
                    attributeId: s.specificationAttributeId,
                    value: s.value,
                    sortOrder: s.sortOrder
                }))
                : [];

            setEditingProduct(fullProduct);
            setFormData({
                name: fullProduct.name || '',
                shortDescription: fullProduct.shortDescription || '',
                description: fullProduct.description || '',
                imageUrl: fullProduct.imageUrl || '',
                categoryId: selectedCategoryId === '' ? '' : String(selectedCategoryId),
                manufacturerId: selectedManufacturerId === '' ? '' : String(selectedManufacturerId),
                price: variant.price ?? '',
                salePrice: variant.salePrice ?? '',
                stock: variant.stockQuantity ?? '',
                sku: variant.sku || '',
                size: variant.size || '',
                color: variant.color || '',
                isActive: fullProduct.isActive !== false,
                isFeatured: Boolean(fullProduct.isFeatured),
                variants,
                specifications: specs,
            });
        } else {
            setEditingProduct(null);
            setFormData({
                ...emptyForm,
                categoryId: availableCategories[0]?.id ? String(availableCategories[0].id) : '',
                sku: `SKU-${Date.now()}`,
                variants: [createEmptyVariant({ sku: `SKU-${Date.now()}` })],
                specifications: [],
            });
        }

        setModalTab('info');
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
        setSavingProduct(true);

        if (!formData.categoryId) {
            setError('Please select a category.');
            return;
        }

        const normalizedVariants = formData.variants.map(v => ({
            id: v.id || undefined,
            sku: v.sku.trim(),
            price: Number(v.price),
            salePrice: v.salePrice === '' ? null : Number(v.salePrice),
            stockQuantity: Number(v.stockQuantity),
            size: v.size.trim(),
            color: v.color.trim(),
            imageUrl: v.imageUrl.trim(),
            isActive: v.isActive,
        }));

        try {
            const basePrice = Math.min(...normalizedVariants.map((variant) => variant.salePrice ?? variant.price));
            const data = {
                name: formData.name.trim(),
                categoryId: Number(formData.categoryId),
                manufacturerId: formData.manufacturerId ? Number(formData.manufacturerId) : null,
                shortDescription: formData.shortDescription.trim(),
                description: formData.description.trim(),
                imageUrl: formData.imageUrl.trim(),
                price: basePrice,
                salePrice: normalizedVariants[0].salePrice,
                stock: normalizedVariants.reduce((sum, variant) => sum + variant.stockQuantity, 0),
                sku: normalizedVariants[0].sku,
                size: normalizedVariants[0].size,
                color: normalizedVariants[0].color,
                variants: normalizedVariants,
                isActive: formData.isActive,
                isFeatured: formData.isFeatured,
                isDigital: formData.isDigital,
                downloadUrl: formData.isDigital ? formData.downloadUrl.trim() : null,
                isRental: formData.isRental,
                rentalPriceLength: formData.isRental ? Number(formData.rentalPriceLength) : null,
                rentalPricePeriod: formData.isRental ? formData.rentalPricePeriod : null,
            };

            let productId;
            if (editingProduct) {
                await productApi.update(editingProduct.id, data);
                productId = editingProduct.id;
            } else {
                const response = await productApi.create(data);
                productId = response.data?.id || response.data?.value?.id;
            }

            if (productId) {
                const normalizedSpecs = formData.specifications
                    .filter(s => s.attributeId && s.value)
                    .map(s => ({
                        attributeId: Number(s.attributeId),
                        value: s.value,
                        sortOrder: Number(s.sortOrder) || 0
                    }));
                await productApi.updateSpecifications(productId, normalizedSpecs);
            }

            closeModal();
            loadProducts();
        } catch (error) {
            setError(error.response?.data?.message || 'Operation failed');
        } finally {
            setSavingProduct(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Stop selling this product?')) return;
        try {
            await productApi.delete(id);
            loadProducts();
        } catch (error) {
            alert('Failed to delete');
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

    const [searchIncludeSubCategories, setSearchIncludeSubCategories] = useState(false);
    const [manufacturerId, setManufacturerId] = useState('');
    const [publishedId, setPublishedId] = useState('0'); // 0: All, 1: Published, 2: Unpublished
    const [goDirectlyToSku, setGoDirectlyToSku] = useState('');
    const [searchOpen, setSearchOpen] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(products.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="content-wrapper">
            <div className="content-header clearfix">
                <h1 className="float-left">
                    Products
                </h1>
                <div className="float-right">
                    {isAdmin() && (
                        <button className="btn btn-primary mr-1" onClick={() => openModal()}>
                            <i className="fas fa-plus-square"></i> Add new
                        </button>
                    )}
                    <button className="btn bg-info mr-1">
                        <i className="fas fa-download"></i> Download catalog as PDF
                    </button>
                    <button className="btn btn-success mr-1">
                        <i className="fas fa-file-export"></i> Export
                    </button>
                    <button className="btn bg-olive mr-1">
                        <i className="fas fa-upload"></i> Import
                    </button>
                    <button className="btn btn-danger" onClick={() => {
                        if (selectedIds.length === 0) alert('Please select at least one product to delete.');
                        else if (window.confirm('Are you sure you want to delete selected products?')) alert('Delete selected logic here');
                    }}>
                        <i className="far fa-trash-alt"></i> Delete (selected)
                    </button>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="form-horizontal">
                        <div className="cards-group">
                            
                            {/* Search Card */}
                            <div className="card card-default card-search">
                                <div className="card-body">
                                    <div className="row search-row opened" onClick={() => setSearchOpen(!searchOpen)} style={{ cursor: 'pointer' }}>
                                        <div className="search-text">Search</div>
                                        <div className="icon-search"><i className="fas fa-search" aria-hidden="true"></i></div>
                                        <div className="icon-collapse"><i className={`far fa-angle-${searchOpen ? 'up' : 'down'}`} aria-hidden="true"></i></div>
                                    </div>

                                    {searchOpen && (
                                        <div className="search-body">
                                            <div className="row">
                                                <div className="col-md-5">
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Product name</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={keyword} onChange={e => setKeyword(e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Category</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <select className="form-control" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                                                                <option value="0">All</option>
                                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Search subcategories</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="checkbox" checked={searchIncludeSubCategories} onChange={e => setSearchIncludeSubCategories(e.target.checked)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Manufacturer</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <select className="form-control" value={manufacturerId} onChange={e => setManufacturerId(e.target.value)}>
                                                                <option value="0">All</option>
                                                                {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-7">
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Published</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <select className="form-control" value={publishedId} onChange={e => setPublishedId(e.target.value)}>
                                                                <option value="0">All</option>
                                                                <option value="1">Published only</option>
                                                                <option value="2">Unpublished only</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Go directly to product SKU</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <div className="input-group input-group-short">
                                                                <input type="text" className="form-control text-box single-line" value={goDirectlyToSku} onChange={e => setGoDirectlyToSku(e.target.value)} />
                                                                <span className="input-group-append">
                                                                    <button type="button" className="btn btn-info btn-flat">Go</button>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Sort by</label>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <select className="form-control" value={sortField} onChange={e => setSortField(e.target.value)}>
                                                                <option value="created">Created date</option>
                                                                <option value="name">Product name</option>
                                                                <option value="price">Price</option>
                                                                <option value="category">Category</option>
                                                                <option value="manufacturer">Manufacturer</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <select className="form-control" value={sortDir} onChange={e => setSortDir(e.target.value)}>
                                                                <option value="desc">Descending</option>
                                                                <option value="asc">Ascending</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="text-center col-12">
                                                    <button type="button" id="search-products" className="btn btn-primary btn-search" disabled={loading} onClick={handleSearch}>
                                                        {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-search mr-1"></i>}
                                                        Search
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Data Grid Card */}
                            <div className="card card-default">
                                <div className="card-body">
                                    <div className="dataTables_wrapper dt-bootstrap4">
                                        <div className="row">
                                            <div className="col-sm-12">
                                                {loading ? <div className="text-center p-5"><i className="fas fa-circle-notch fa-spin fa-2x"></i></div> : (
                                                    <table className="table table-bordered table-hover table-striped dataTable">
                                                        <thead>
                                                            <tr>
                                                                <th className="text-center" style={{ width: 50 }}>
                                                                    <input type="checkbox" checked={selectedIds.length === products.length && products.length > 0} onChange={handleSelectAll} />
                                                                </th>
                                                                <th className="text-center" style={{ width: 100 }}>Picture</th>
                                                                <th>Product name</th>
                                                                <th style={{ width: 150 }}>SKU</th>
                                                                <th style={{ width: 150 }}>Price</th>
                                                                <th style={{ width: 100 }}>Stock quantity</th>
                                                                <th className="text-center" style={{ width: 100 }}>Published</th>
                                                                <th className="text-center" style={{ width: 100 }}>Edit</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {products.length === 0 ? (
                                                                <tr><td colSpan="8" className="text-center">No records</td></tr>
                                                            ) : products.map(p => {
                                                                const isChecked = selectedIds.includes(p.id);
                                                                return (
                                                                    <tr key={p.id}>
                                                                        <td className="text-center">
                                                                            <input type="checkbox" checked={isChecked} onChange={() => handleSelectRow(p.id)} />
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <img src={getVariantPreviewImage(firstVariant(p), getProductImage(p))} style={{ width: 75 }} alt={p.name} />
                                                                        </td>
                                                                        <td>
                                                                            {p.name}
                                                                            {p.manufacturer?.name && <div className="text-muted text-sm">{p.manufacturer.name}</div>}
                                                                        </td>
                                                                        <td>{firstVariant(p).sku || p.sku}</td>
                                                                        <td>{formatCurrency(p.price)}</td>
                                                                        <td>{p.stock}</td>
                                                                        <td className="text-center">
                                                                            {p.isActive ? (
                                                                                <i className="fas fa-check true-icon text-success"></i>
                                                                            ) : (
                                                                                <i className="fas fa-times false-icon text-danger"></i>
                                                                            )}
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <button className="btn btn-default btn-sm" onClick={() => openModal(p)}>
                                                                                <i className="fas fa-pencil-alt"></i> Edit
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </div>
                                        <div className="row mt-3">
                                            <div className="col-sm-12 col-md-5">
                                                <div className="dataTables_info">
                                                    Showing {products.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
                                                </div>
                                            </div>
                                            <div className="col-sm-12 col-md-7">
                                                <div className="dataTables_paginate paging_simple_numbers float-right">
                                                    <ul className="pagination pagination-sm m-0">
                                                        {renderPagination()}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editingProduct ? 'Edit' : 'Add'} Product</h5>
                                <button type="button" className="close" onClick={closeModal}>&times;</button>
                            </div>
                            <div className="modal-nav bg-light border-bottom">
                                <ul className="nav nav-tabs px-3 pt-2">
                                    {['info', 'variants', 'specs'].map(t => (
                                        <li className="nav-item" key={t}>
                                            <button type="button" className={`nav-link ${modalTab === t ? 'active' : ''}`} onClick={() => setModalTab(t)}>{t.toUpperCase()}</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                                    {modalTab === 'info' && (
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group"><label>Name</label><input className="form-control" required value={formData.name} onChange={e => setField('name', e.target.value)} /></div>
                                                <div className="form-group"><label>Category</label>
                                                    <select className="form-control" required value={formData.categoryId} onChange={e => setField('categoryId', e.target.value)}>
                                                        <option value="">Select Category</option>
                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-group"><label>Brand</label>
                                                    <select className="form-control" value={formData.manufacturerId} onChange={e => setField('manufacturerId', e.target.value)}>
                                                        <option value="">Select Brand</option>
                                                        {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Image URL</label>
                                                    <div className="input-group">
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            value={formData.imageUrl} 
                                                            onChange={e => setField('imageUrl', e.target.value)} 
                                                            placeholder="/img/product-1.jpg or custom URL"
                                                        />
                                                        <div className="input-group-append">
                                                            <label className="btn btn-secondary m-0 d-flex align-items-center">
                                                                Browse...
                                                                <input 
                                                                    type="file" 
                                                                    accept="image/*" 
                                                                    style={{ display: 'none' }} 
                                                                    onChange={e => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            setField('imageUrl', `/img/${file.name}`);
                                                                        }
                                                                    }} 
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="custom-control custom-switch mt-4"><input type="checkbox" className="custom-control-input" id="sw1" checked={formData.isActive} onChange={e => setField('isActive', e.target.checked)} /><label className="custom-control-label" htmlFor="sw1">Is Active</label></div>
                                                <div className="custom-control custom-switch mt-2"><input type="checkbox" className="custom-control-input" id="sw2" checked={formData.isFeatured} onChange={e => setField('isFeatured', e.target.checked)} /><label className="custom-control-label" htmlFor="sw2">Is Featured</label></div>
                                            </div>
                                            <div className="col-12 mt-2">
                                                <div className="form-group"><label>Short Description</label><input className="form-control" value={formData.shortDescription} onChange={e => setField('shortDescription', e.target.value)} /></div>
                                                <div className="form-group"><label>Full Description</label><textarea className="form-control" rows={4} value={formData.description} onChange={e => setField('description', e.target.value)} /></div>
                                            </div>
                                        </div>
                                    )}
                                    {modalTab === 'variants' && (
                                        <div className="table-responsive">
                                            <table className="table table-sm table-bordered align-middle">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: 92 }}>Image</th>
                                                        <th style={{ minWidth: 240 }}>Image URL</th>
                                                        <th style={{ minWidth: 100 }}>Size</th>
                                                        <th style={{ minWidth: 100 }}>Color</th>
                                                        <th style={{ minWidth: 110 }}>Price</th>
                                                        <th style={{ minWidth: 110 }}>Sale</th>
                                                        <th style={{ minWidth: 90 }}>Stock</th>
                                                        <th style={{ minWidth: 150 }}>SKU</th>
                                                        <th style={{ width: 70 }}>Active</th>
                                                        <th style={{ width: 52 }}>
                                                            <button type="button" className="btn btn-xs btn-primary" onClick={addVariant}>+</button>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formData.variants.map((v, i) => {
                                                        const variantImage = v.imageUrl || formData.imageUrl || '/img/product-1.jpg';

                                                        return (
                                                            <tr key={i}>
                                                                <td>
                                                                    <img
                                                                        src={variantImage}
                                                                        alt={`Variant ${i + 1}`}
                                                                        className="img-thumbnail"
                                                                        style={{ width: 64, height: 64, objectFit: 'cover' }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        className="form-control form-control-sm mb-1"
                                                                        placeholder="https://.../variant-image.jpg"
                                                                        value={v.imageUrl}
                                                                        onChange={e => setVariantField(i, 'imageUrl', e.target.value)}
                                                                    />
                                                                    <div className="btn-group btn-group-xs">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-secondary"
                                                                            onClick={() => setVariantField(i, 'imageUrl', formData.imageUrl)}
                                                                            disabled={!formData.imageUrl}
                                                                        >
                                                                            Use product image
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-secondary"
                                                                            onClick={() => setVariantField(i, 'imageUrl', '')}
                                                                            disabled={!v.imageUrl}
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td><input className="form-control form-control-sm" value={v.size} onChange={e => setVariantField(i, 'size', e.target.value)} /></td>
                                                                <td><input className="form-control form-control-sm" value={v.color} onChange={e => setVariantField(i, 'color', e.target.value)} /></td>
                                                                <td><input type="number" className="form-control form-control-sm" value={v.price} onChange={e => setVariantField(i, 'price', e.target.value)} /></td>
                                                                <td><input type="number" className="form-control form-control-sm" value={v.salePrice} onChange={e => setVariantField(i, 'salePrice', e.target.value)} /></td>
                                                                <td><input type="number" className="form-control form-control-sm" value={v.stockQuantity} onChange={e => setVariantField(i, 'stockQuantity', e.target.value)} /></td>
                                                                <td><input className="form-control form-control-sm" value={v.sku} onChange={e => setVariantField(i, 'sku', e.target.value)} /></td>
                                                                <td className="text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={v.isActive}
                                                                        onChange={e => setVariantField(i, 'isActive', e.target.checked)}
                                                                    />
                                                                </td>
                                                                <td><button type="button" className="btn btn-xs btn-danger" onClick={() => removeVariant(i)} disabled={formData.variants.length <= 1}>x</button></td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {modalTab === 'specs' && (
                                        <table className="table table-sm table-bordered">
                                            <thead><tr><th>Attribute</th><th>Value</th><th>Order</th><th><button type="button" className="btn btn-xs btn-primary" onClick={addSpec}>+</button></th></tr></thead>
                                            <tbody>
                                                {formData.specifications.map((s, i) => (
                                                    <tr key={i}>
                                                        <td><select className="form-control form-control-sm" value={s.attributeId} onChange={e => setSpecField(i, 'attributeId', e.target.value)}><option value="">Select</option>{specAttributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></td>
                                                        <td><input className="form-control form-control-sm" value={s.value} onChange={e => setSpecField(i, 'value', e.target.value)} /></td>
                                                        <td><input type="number" className="form-control form-control-sm" value={s.sortOrder} onChange={e => setSpecField(i, 'sortOrder', e.target.value)} /></td>
                                                        <td><button type="button" className="btn btn-xs btn-danger" onClick={() => removeSpec(i)}>x</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" disabled={savingProduct} onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={savingProduct}>
                                        {savingProduct ? <><i className="fas fa-spinner fa-spin mr-1"></i>Saving...</> : 'Save Product'}
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

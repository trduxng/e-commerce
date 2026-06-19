import React, { useEffect, useState } from 'react';
import { productApi, categoryApi, manufacturerApi, specificationAttributeApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getProductImage } from '../data/shopData';
import { utils, writeFile, read } from 'xlsx';


export const removeVietnameseTones = (str) => {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng 
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
    return str;
};

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

const buildPaginationItems = (currentPage, totalPages) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

    if (currentPage <= 4) {
        [2, 3, 4, 5].forEach(pageNumber => pages.add(pageNumber));
    }

    if (currentPage >= totalPages - 3) {
        [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1]
            .forEach(pageNumber => pages.add(pageNumber));
    }

    const sortedPages = [...pages]
        .filter(pageNumber => pageNumber >= 1 && pageNumber <= totalPages)
        .sort((first, second) => first - second);

    return sortedPages.flatMap((pageNumber, index) => {
        const previousPage = sortedPages[index - 1];
        return previousPage && pageNumber - previousPage > 1
            ? ['ellipsis', pageNumber]
            : [pageNumber];
    });
};



const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [specAttributes, setSpecAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [averagePrice, setAveragePrice] = useState(0);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [savingProduct, setSavingProduct] = useState(false);
    const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalTab, setModalTab] = useState('info'); // 'info', 'variants', 'specs'
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [error, setError] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    const { isStaff } = useAuth();

    useEffect(() => {
        loadCategories();
        loadManufacturers();
        loadSpecAttributes();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [page, pageSize]);

    const firstVariant = (product) => (
        product?.productVariants?.find((variant) => variant?.isActive !== false)
        || product?.productVariants?.[0]
        || {}
    );

    const getVariantPreviewImage = (variant, fallback = '') =>
        variant?.imageUrl || fallback || '/img/product-1.jpg';

    // Metadata này dùng để dựng form thông số kỹ thuật động cho sản phẩm.
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

    // Bộ lọc và phân trang được gửi lên backend; frontend chỉ giữ dữ liệu của trang hiện tại.
    const loadProducts = async () => {
        setLoading(true);

        try {
            const response = await productApi.search({
                keyword,
                categoryId: categoryId && categoryId !== '0' ? categoryId : undefined,
                minPrice: minPrice !== '' ? Number(minPrice) : undefined,
                maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
                page,
                pageSize,
            });
            const items = Array.isArray(response.data?.items)
                ? response.data.items
                : normalizeList(response.data);
            const responseTotalCount = Number(response.data?.totalCount);
            const nextTotalCount = Number.isFinite(responseTotalCount)
                ? responseTotalCount
                : items.length;
            const responseTotalPages = Number(response.data?.totalPages);
            const nextTotalPages = Number.isFinite(responseTotalPages)
                ? responseTotalPages
                : Math.ceil(nextTotalCount / pageSize);

            setProducts(items);
            setAveragePrice(Number(response.data?.averagePrice) || 0);
            setTotalCount(nextTotalCount);
            setTotalPages(nextTotalPages);
            setSelectedIds([]);

            if (nextTotalPages > 0 && page > nextTotalPages) {
                setPage(nextTotalPages);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            setProducts([]);
            setTotalCount(0);
            setTotalPages(0);
            setError(error.response?.data?.message || 'Failed to load products.');
        } finally {
            setLoading(false);
        }
    };
    const handleSearch = (event) => {
        event.preventDefault();

        if (
            minPrice !== '' &&
            maxPrice !== '' &&
            Number(minPrice) > Number(maxPrice)
        ) {
            alert('Giá từ không được lớn hơn giá đến.');
            return;
        }

        if (page === 1) {
            loadProducts();
        } else {
            setPage(1);
        }
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

    const handleVariantImageUpload = async (index, event) => {
        const input = event.target;
        const file = input.files?.[0];
        if (!file) return;

        setUploadingVariantIndex(index);
        try {
            const response = await productApi.uploadImage(file);
            setVariantField(index, 'imageUrl', response.data.url);
        } catch (error) {
            alert(error.response?.data?.message || 'Không thể tải ảnh biến thể lên.');
        } finally {
            setUploadingVariantIndex(null);
            input.value = '';
        }
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

    // Cùng một modal phục vụ tạo mới và chỉnh sửa, đồng thời chuẩn hóa variant/specification vào form.
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

            const allVariants = Array.isArray(fullProduct.productVariants)
                ? fullProduct.productVariants
                : [];
            const activeVariants = allVariants.filter((variant) => variant?.isActive !== false);
            const editableVariants = activeVariants.length > 0
                ? activeVariants
                : allVariants.slice(0, 1);
            const variants = editableVariants.length > 0
                ? editableVariants.map((variant) => ({
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

    // Chuyển dữ liệu chuỗi từ input thành kiểu số/null đúng với DTO backend.
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

    // Backend thực hiện soft-delete để giữ liên kết với lịch sử đơn hàng.
    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xoá sản phẩm này không?')) return;
        try {
            await productApi.delete(id);
            loadProducts();
        } catch (error) {
            alert('Xoá thất bại. Sản phẩm có thể đang có đơn hàng liên kết.');
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) {
            alert('Vui lòng chọn ít nhất một sản phẩm để xoá.');
            return;
        }
        if (!window.confirm(`Bạn có chắc chắn muốn xoá ${selectedIds.length} sản phẩm đã chọn không?`)) return;

        try {
            for (const id of selectedIds) {
                await productApi.delete(id);
            }
            setSelectedIds([]);
            loadProducts();
        } catch (error) {
            alert('Xoá hàng loạt thất bại. Một số sản phẩm có thể đang có liên kết.');
        }
    };

    const exportToExcel = () => {
        const data = products.map(p => {
            const variant = normalizeList(p.variants)[0] || {};
            return {
                'ID': p.id,
                'Tên sản phẩm': p.name,
                'Mã SKU': variant.sku || '',
                'Danh mục': p.category?.name || '',
                'Thương hiệu': p.manufacturer?.name || '',
                'Giá gốc': p.basePrice || 0,
                'Số lượng': variant.stockQuantity || 0,
                'Trạng thái': p.isActive ? 'Hoạt động' : 'Đã ẩn',
                'Ngày tạo': p.createdAt ? new Date(p.createdAt).toLocaleString('vi-VN') : ''
            };
        });
        const worksheet = utils.json_to_sheet(data);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Products');
        writeFile(workbook, 'Danh_sach_san_pham.xlsx');
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = utils.sheet_to_json(ws);

                let successCount = 0;
                for (const row of data) {
                    const categoryName = row['Tên danh mục'] || row['Danh mục'] || row['Category'];
                    let foundCatId = categories.length > 0 ? categories[0].id : null;
                    if (categoryName) {
                        const matched = categories.find(c => c.name.toLowerCase() === String(categoryName).trim().toLowerCase());
                        if (matched) foundCatId = matched.id;
                    }

                    const newProduct = {
                        name: row['Tên sản phẩm'] || row['Name'] || 'Sản phẩm mới',
                        shortDescription: row['Mô tả ngắn'] || '',
                        description: row['Mô tả chi tiết'] || '',
                        basePrice: Number(row['Giá gốc'] || row['Price'] || 0),
                        categoryId: foundCatId,
                        isActive: true,
                        isFeatured: false,
                        variants: [{
                            sku: row['Mã SKU'] || row['SKU'] || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                            price: Number(row['Giá gốc'] || row['Price'] || 0),
                            stockQuantity: Number(row['Số lượng'] || row['Stock'] || 0),
                            isActive: true
                        }],
                        specifications: []
                    };

                    try {
                        await productApi.create(newProduct);
                        successCount++;
                    } catch (err) {
                        console.error('Error importing product:', err);
                    }
                }
                alert(`Đã nhập thành công ${successCount}/${data.length} sản phẩm.`);
                loadProducts();
            } catch (error) {
                console.error("Error reading file:", error);
                alert('Lỗi đọc file Excel.');
            }
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    const renderPagination = () => {
        const availablePages = Math.max(totalPages, 1);
        const changePage = (nextPage) => {
            const safePage = Math.min(Math.max(nextPage, 1), availablePages);
            if (safePage !== page && !loading) {
                setPage(safePage);
            }
        };

        return (
            <>
                <li className={`page-item ${page <= 1 || loading ? 'disabled' : ''}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => changePage(page - 1)}
                        disabled={page <= 1 || loading}
                    >
                        Trước
                    </button>
                </li>
                {buildPaginationItems(page, availablePages).map((pageItem, index) => (
                    pageItem === 'ellipsis' ? (
                        <li key={`ellipsis-${index}`} className="page-item disabled">
                            <span className="page-link">…</span>
                        </li>
                    ) : (
                        <li key={pageItem} className={`page-item ${page === pageItem ? 'active' : ''}`}>
                            <button
                                type="button"
                                className="page-link"
                                onClick={() => changePage(pageItem)}
                                disabled={loading || page === pageItem}
                            >
                                {pageItem}
                            </button>
                        </li>
                    )
                ))}
                <li className={`page-item ${page >= availablePages || totalPages === 0 || loading ? 'disabled' : ''}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => changePage(page + 1)}
                        disabled={page >= availablePages || totalPages === 0 || loading}
                    >
                        Sau
                    </button>
                </li>
            </>
        );
    };

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
                    Sản phẩm
                </h1>
                <div className="float-right">
                    {isStaff() && (
                        <button className="btn btn-primary mr-1" onClick={() => openModal()}>
                            <i className="fas fa-plus-square"></i> Thêm mới
                        </button>
                    )}

                    <button className="btn btn-success mr-1" onClick={exportToExcel}>
                        <i className="far fa-file-excel"></i> Xuất Excel
                    </button>
                    {isStaff() && (
                        <>
                            <input type="file" accept=".xlsx, .xls" id="import-products" style={{ display: 'none' }} onChange={handleImportExcel} />
                            <label htmlFor="import-products" className="btn bg-olive mr-1 mb-0" style={{ cursor: 'pointer', verticalAlign: 'baseline', height: '100%' }}>
                                <i className="fas fa-upload"></i> Nhập Excel
                            </label>
                        </>
                    )}

                    <button className="btn btn-danger" onClick={handleDeleteSelected}>
                        <i className="far fa-trash-alt"></i> Xoá (đã chọn)
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
                                        <div className="search-text">Tìm kiếm</div>
                                        <div className="icon-search"><i className="fas fa-search" aria-hidden="true"></i></div>
                                        <div className="icon-collapse"><i className={`far fa-angle-${searchOpen ? 'up' : 'down'}`} aria-hidden="true"></i></div>
                                    </div>

                                    {searchOpen && (
                                        <div className="search-body">
                                            <div className="row">
                                                <div className="col-md-8 mx-auto">
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Tên sản phẩm</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={keyword} onChange={e => setKeyword(e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Khoảng giá</label>
                                                        </div>

                                                        <div className="col-md-4">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="form-control"
                                                                placeholder="Giá từ"
                                                                value={minPrice}
                                                                onChange={(e) => setMinPrice(e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="col-md-4">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="form-control"
                                                                placeholder="Giá đến"
                                                                value={maxPrice}
                                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label>Thể loại</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <select className="form-control" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                                                                <option value="0">Tất cả</option>
                                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="text-center col-12">
                                                    <button type="button" id="search-products" className="btn btn-primary btn-search" disabled={loading} onClick={handleSearch}>
                                                        {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-search mr-1"></i>}
                                                        Tìm kiếm
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

                                    <div className="alert alert-info">
                                        Giá trung bình của tất cả sản phẩm:
                                        <strong className="ml-2">
                                            {formatCurrency(averagePrice)}
                                        </strong>
                                    </div>

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
                                                                <th className="text-center" style={{ width: 100 }}>Hình ảnh</th>
                                                                <th>Tên sản phẩm</th>
                                                                <th style={{ width: 150 }}>SKU</th>
                                                                <th style={{ width: 150 }}>Giá</th>
                                                                <th style={{ width: 100 }}>Tồn kho</th>
                                                                <th className="text-center" style={{ width: 100 }}>Trạng thái</th>
                                                                <th className="text-center" style={{ width: 100 }}>Sửa</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {products.length === 0 ? (
                                                                <tr><td colSpan="8" className="text-center">Không có bản ghi nào</td></tr>
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
                                                                            {p.variants && p.variants.length > 0 && (
                                                                                <div className="mt-1">
                                                                                    {p.variants.map((v, index) => (
                                                                                        <span key={v.id || index} className="badge badge-info mr-1">
                                                                                            {v.size && v.color ? `${v.size} - ${v.color}` : (v.size || v.color || `Mẫu ${index + 1}`)}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            )}
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
                                                                            <button className="btn btn-default btn-sm mr-1" onClick={() => openModal(p)}>
                                                                                <i className="fas fa-pencil-alt"></i> Sửa
                                                                            </button>
                                                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                                                                                <i className="fas fa-trash-alt"></i> Xoá
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
                                                <div className="d-flex align-items-center flex-wrap">
                                                    <div className="dataTables_length mr-3 mb-2">
                                                        <label className="mb-0">
                                                            Hiển thị{' '}
                                                            <select
                                                                className="custom-select custom-select-sm form-control form-control-sm d-inline-block mx-1"
                                                                style={{ width: 'auto' }}
                                                                value={pageSize}
                                                                onChange={event => {
                                                                    setPageSize(Number(event.target.value));
                                                                    setPage(1);
                                                                }}
                                                                disabled={loading}
                                                            >
                                                                {[10, 20, 50, 100].map(size => (
                                                                    <option key={size} value={size}>{size}</option>
                                                                ))}
                                                            </select>
                                                            bản ghi
                                                        </label>
                                                    </div>
                                                    <div className="dataTables_info mb-2">
                                                        {products.length > 0 ? (page - 1) * pageSize + 1 : 0}
                                                        {' - '}
                                                        {products.length > 0
                                                            ? Math.min((page - 1) * pageSize + products.length, totalCount)
                                                            : 0}
                                                        {' / '}
                                                        {totalCount}
                                                    </div>
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
                                <h5 className="modal-title">{editingProduct ? 'Sửa' : 'Thêm'} sản phẩm</h5>
                                <button type="button" className="close" onClick={closeModal}>&times;</button>
                            </div>
                            <div className="modal-nav bg-light border-bottom">
                                <ul className="nav nav-tabs px-3 pt-2">
                                    {['info', 'variants', 'specs'].map(t => (
                                        <li className="nav-item" key={t}>
                                            <button type="button" className={`nav-link ${modalTab === t ? 'active' : ''}`} onClick={() => setModalTab(t)}>
                                                {t === 'info' ? 'THÔNG TIN' : t === 'variants' ? 'PHÂN LOẠI' : 'THÔNG SỐ KỸ THUẬT'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                    {modalTab === 'info' && (
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group"><label>Tên sản phẩm</label><input className="form-control" required value={formData.name} onChange={e => setField('name', e.target.value)} /></div>
                                                <div className="form-group"><label>Danh mục</label>
                                                    <select className="form-control" required value={formData.categoryId} onChange={e => setField('categoryId', e.target.value)}>
                                                        <option value="">Chọn danh mục</option>
                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-group"><label>Thương hiệu</label>
                                                    <select className="form-control" value={formData.manufacturerId} onChange={e => setField('manufacturerId', e.target.value)}>
                                                        <option value="">Chọn thương hiệu</option>
                                                        {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>URL Hình ảnh</label>
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
                                                                Duyệt...
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
                                                <div className="custom-control custom-switch mt-4"><input type="checkbox" className="custom-control-input" id="sw1" checked={formData.isActive} onChange={e => setField('isActive', e.target.checked)} /><label className="custom-control-label" htmlFor="sw1">Kích hoạt</label></div>
                                                <div className="custom-control custom-switch mt-2"><input type="checkbox" className="custom-control-input" id="sw2" checked={formData.isFeatured} onChange={e => setField('isFeatured', e.target.checked)} /><label className="custom-control-label" htmlFor="sw2">Nổi bật</label></div>
                                            </div>
                                            <div className="col-12 mt-2">
                                                <div className="form-group"><label>Mô tả ngắn</label><input className="form-control" value={formData.shortDescription} onChange={e => setField('shortDescription', e.target.value)} /></div>
                                                <div className="form-group"><label>Mô tả chi tiết</label><textarea className="form-control" rows={4} value={formData.description} onChange={e => setField('description', e.target.value)} /></div>
                                            </div>
                                        </div>
                                    )}
                                    {modalTab === 'variants' && (
                                        <div className="table-responsive">
                                            <table className="table table-sm table-bordered align-middle">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: 92 }}>Ảnh</th>
                                                        <th style={{ minWidth: 240 }}>URL Hình ảnh</th>
                                                        <th style={{ minWidth: 100 }}>Kích thước</th>
                                                        <th style={{ minWidth: 100 }}>Màu sắc</th>
                                                        <th style={{ minWidth: 110 }}>Giá gốc</th>
                                                        <th style={{ minWidth: 110 }}>Giá KM</th>
                                                        <th style={{ minWidth: 90 }}>Tồn kho</th>
                                                        <th style={{ minWidth: 150 }}>SKU</th>
                                                        <th style={{ width: 70 }}>Hiển thị</th>
                                                        <th style={{ width: 52 }}>
                                                            <button type="button" className="btn btn-xs btn-primary" onClick={addVariant}>+</button>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formData.variants.map((v, i) => {
                                                        const variantImage = v.imageUrl || formData.imageUrl || '/img/product-1.jpg';

                                                        return (
                                                            <tr key={v.id ?? v.sku ?? i}>
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
                                                                        <label className={`btn btn-outline-primary mb-0 ${uploadingVariantIndex === i ? 'disabled' : ''}`}>
                                                                            {uploadingVariantIndex === i ? 'Đang tải...' : 'Duyệt...'}
                                                                            <input
                                                                                type="file"
                                                                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                                                                style={{ display: 'none' }}
                                                                                disabled={uploadingVariantIndex === i}
                                                                                onChange={event => handleVariantImageUpload(i, event)}
                                                                            />
                                                                        </label>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-secondary"
                                                                            onClick={() => setVariantField(i, 'imageUrl', formData.imageUrl)}
                                                                            disabled={!formData.imageUrl}
                                                                        >
                                                                            Lấy ảnh SP
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-secondary"
                                                                            onClick={() => setVariantField(i, 'imageUrl', '')}
                                                                            disabled={!v.imageUrl}
                                                                        >
                                                                            Xoá ảnh
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
                                            <thead><tr><th>Thuộc tính</th><th>Giá trị</th><th>Thứ tự</th><th><button type="button" className="btn btn-xs btn-primary" onClick={addSpec}>+</button></th></tr></thead>
                                            <tbody>
                                                {formData.specifications.map((s, i) => (
                                                    <tr key={i}>
                                                        <td><select className="form-control form-control-sm" value={s.attributeId} onChange={e => setSpecField(i, 'attributeId', e.target.value)}><option value="">Chọn</option>{specAttributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></td>
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
                                    <button type="button" className="btn btn-secondary" disabled={savingProduct} onClick={closeModal}>Huỷ</button>
                                    <button type="submit" className="btn btn-primary" disabled={savingProduct}>
                                        {savingProduct ? <><i className="fas fa-spinner fa-spin mr-1"></i>Đang lưu...</> : 'Lưu sản phẩm'}
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

import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { formatCurrency } from "../../data/shopData";

const MiniCart = () => {
    const { items, count, total, removeFromCart } = useCart();

    return (
        <div className="btn-group ml-3">
            <button 
                type="button" 
                className="btn btn-link px-0 dropdown-toggle" 
                data-toggle="dropdown"
                style={{ textDecoration: 'none' }}
            >
                <i className="fas fa-shopping-cart text-primary"></i>
                <span className="badge text-secondary border border-secondary rounded-circle" style={{ paddingBottom: "2px" }}>
                    {count}
                </span>
            </button>
            <div className="dropdown-menu dropdown-menu-right" style={{ width: '300px', padding: '15px' }}>
                <h6 className="dropdown-header px-0">Recently Added Products</h6>
                <div className="dropdown-divider"></div>
                
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {items.length === 0 ? (
                        <div className="text-center py-3">
                            <p className="mb-0 text-muted">Your cart is empty</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="d-flex align-items-center mb-3">
                                <img src={item.imageUrl} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover' }} className="mr-2" />
                                <div className="flex-fill overflow-hidden mr-2">
                                    <h6 className="mb-0 text-truncate" title={item.name}>{item.name}</h6>
                                    <small className="text-muted">{item.quantity} x {formatCurrency(item.price)}</small>
                                </div>
                                <button 
                                    className="btn btn-sm text-danger" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removeFromCart(item.id);
                                    }}
                                >
                                    <i className="fa fa-times"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <>
                        <div className="dropdown-divider"></div>
                        <div className="d-flex justify-content-between mb-3">
                            <strong>Total:</strong>
                            <strong className="text-primary">{formatCurrency(total)}</strong>
                        </div>
                        <div className="d-flex">
                            <Link to="/cart" className="btn btn-sm btn-outline-primary flex-fill mr-2">View Cart</Link>
                            <Link to="/checkout" className="btn btn-sm btn-primary flex-fill">Checkout</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MiniCart;

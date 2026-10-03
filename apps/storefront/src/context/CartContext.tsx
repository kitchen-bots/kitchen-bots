import React, { useState, useCallback } from 'react';
import { trackAddToCart } from '../lib/analytics';
import { CartContext, type CartItem, MIN_ITEM_QUANTITY, MAX_ITEM_QUANTITY } from './CartContextData';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      if (typeof window === 'undefined') return [];
      const saved = localStorage.getItem('kb_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: CartItem) => ({
          ...item,
          quantity: Math.max(MIN_ITEM_QUANTITY, item.quantity || MIN_ITEM_QUANTITY),
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('kb_cart', JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }, [items]);

  const addToCart = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.id === newItem.id);
      const newQuantity = existingItem ? existingItem.quantity + 1 : MIN_ITEM_QUANTITY;

      // Fire analytics
      trackAddToCart({
        productId: newItem.id,
        productName: newItem.name,
        price: newItem.price,
        quantity: existingItem ? 1 : MIN_ITEM_QUANTITY,
      });

      if (existingItem) {
        return prev.map(item =>
          item.id === newItem.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { ...newItem, quantity: MIN_ITEM_QUANTITY }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < MIN_ITEM_QUANTITY) {
      removeFromCart(id);
      return;
    }
    const sanitized = Math.min(MAX_ITEM_QUANTITY, Math.floor(quantity));
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: sanitized } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPaise = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const totalPrice = totalPaise / 100;

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPaise,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

import React, { useState, useCallback } from 'react';
import { trackAddToCart } from '../lib/analytics';
import { CartContext, type CartItem, MAX_ITEM_QUANTITY } from './CartContextData';

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
          quantity: Math.min(MAX_ITEM_QUANTITY, Math.max(1, item.quantity || 1)),
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
      if (existingItem && existingItem.quantity >= MAX_ITEM_QUANTITY) {
        return prev;
      }
      const newQuantity = existingItem ? Math.min(MAX_ITEM_QUANTITY, existingItem.quantity + 1) : 1;

      // Fire analytics
      trackAddToCart({
        productId: newItem.id,
        productName: newItem.name,
        price: newItem.price,
        quantity: 1,
      });

      if (existingItem) {
        return prev.map(item =>
          item.id === newItem.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const clampedQuantity = Math.min(MAX_ITEM_QUANTITY, Math.floor(quantity));
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: clampedQuantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

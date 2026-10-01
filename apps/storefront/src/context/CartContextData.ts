import React from 'react';

export const MAX_ITEM_QUANTITY = 5;

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  configuration?: Record<string, string>;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

export const CartContext = React.createContext<CartContextType | undefined>(undefined);

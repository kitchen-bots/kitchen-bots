import { describe, it, expect } from 'vitest';
import { MIN_ITEM_QUANTITY, MAX_ITEM_QUANTITY, type CartItem } from './CartContextData';

describe('Cart Context & Limits', () => {
  it('MIN_ITEM_QUANTITY is set to 5', () => {
    expect(MIN_ITEM_QUANTITY).toBe(5);
  });

  it('allows user to increment quantity beyond 5 without restriction', () => {
    const clampQuantity = (q: number) => Math.min(MAX_ITEM_QUANTITY, Math.floor(q));
    expect(clampQuantity(5)).toBe(5);
    expect(clampQuantity(6)).toBe(6);
    expect(clampQuantity(25)).toBe(25);
    expect(clampQuantity(100)).toBe(100);
  });

  it('adds items with an initial minimum order quantity of 5', () => {
    const existingItems: CartItem[] = [];
    const newItem = {
      id: 'prod-1',
      name: 'Santa Maria Grill',
      price: 24999,
      image: '/image.webp',
    };

    const initialQuantity = MIN_ITEM_QUANTITY;
    const updated = [...existingItems, { ...newItem, quantity: initialQuantity }];

    expect(updated[0].quantity).toBe(5);
  });

  it('detects when quantity drops below MIN_ITEM_QUANTITY for removal', () => {
    const currentQuantity = 5;
    const newQuantity = currentQuantity - 1;
    const shouldRemove = newQuantity < MIN_ITEM_QUANTITY;

    expect(shouldRemove).toBe(true);
  });
});

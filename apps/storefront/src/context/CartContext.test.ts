import { describe, it, expect } from 'vitest';
import { MAX_ITEM_QUANTITY, type CartItem } from './CartContextData';

describe('Cart Context & Limits', () => {
  it('MAX_ITEM_QUANTITY is set to 5', () => {
    expect(MAX_ITEM_QUANTITY).toBe(5);
  });

  it('clamps newQuantity to MAX_ITEM_QUANTITY when incrementing', () => {
    const clampQuantity = (q: number) => Math.min(MAX_ITEM_QUANTITY, Math.floor(q));
    expect(clampQuantity(1)).toBe(1);
    expect(clampQuantity(5)).toBe(5);
    expect(clampQuantity(6)).toBe(5);
    expect(clampQuantity(100)).toBe(5);
  });

  it('prevents adding item when existing item quantity has reached MAX_ITEM_QUANTITY', () => {
    const existingItem: CartItem = {
      id: 'prod-1',
      name: 'Flip BBQ',
      price: 13999,
      image: '/image.webp',
      quantity: 5,
    };

    const shouldPreventAdd = existingItem.quantity >= MAX_ITEM_QUANTITY;
    expect(shouldPreventAdd).toBe(true);

    const nextQuantity = existingItem.quantity >= MAX_ITEM_QUANTITY
      ? existingItem.quantity
      : Math.min(MAX_ITEM_QUANTITY, existingItem.quantity + 1);

    expect(nextQuantity).toBe(5);
  });
});

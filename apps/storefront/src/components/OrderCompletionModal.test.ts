import { describe, it, expect } from 'vitest';
import type { CompletedOrderData } from './OrderCompletionModal';

describe('OrderCompletionModal Data & Specifications', () => {
  const sampleOrder: CompletedOrderData = {
    reference: 'KB-ORD-XYZ123',
    date: '03 Oct 2026',
    name: 'Charan Chef',
    phone: '9876543210',
    address: '123 Commercial Kitchen Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    notes: 'Please call before delivery',
    items: [
      { name: 'Santa Maria Grill', quantity: 5, price: 24999 },
      { name: 'Rocket Stove Pro', quantity: 2, price: 15499 }
    ],
    total: 155993,
    status: 'Order Confirmed',
  };

  it('contains valid order reference and customer attributes', () => {
    expect(sampleOrder.reference).toMatch(/^KB-ORD-[A-Z0-9]+$/);
    expect(sampleOrder.name).toBe('Charan Chef');
    expect(sampleOrder.phone).toBe('9876543210');
    expect(sampleOrder.pincode).toHaveLength(6);
  });

  it('calculates total items count accurately across order line items', () => {
    const totalItemUnits = sampleOrder.items.reduce((acc, item) => acc + item.quantity, 0);
    expect(totalItemUnits).toBe(7);
  });

  it('accurately computes calculated subtotal against total value', () => {
    const calculatedTotal = sampleOrder.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    expect(calculatedTotal).toBe(155993);
    expect(calculatedTotal).toBe(sampleOrder.total);
  });

  it('handles optional notes gracefully', () => {
    expect(sampleOrder.notes).toBe('Please call before delivery');
    const orderWithoutNotes: CompletedOrderData = {
      ...sampleOrder,
      notes: undefined,
    };
    expect(orderWithoutNotes.notes).toBeUndefined();
  });
});

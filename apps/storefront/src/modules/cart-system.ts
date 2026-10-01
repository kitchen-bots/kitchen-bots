/**
 * cart-system.ts
 * Re-exports cart context hooks and types for clean imports across the app.
 */

export { useCart } from '../hooks/use-cart';
export { MAX_ITEM_QUANTITY } from '../context/CartContextData';
export type { CartItem } from '../context/CartContextData';

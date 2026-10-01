// Shared page type - imported by portals to avoid circular dependency on App.tsx
export type Page =
  | 'home' | 'products' | 'product-detail' | 'contact' | 'about'
  | 'policies' | 'capabilities' | 'blog' | 'login' | 'forgot-password'
  | 'cart' | 'wishlist' | 'bulk-enquiry';

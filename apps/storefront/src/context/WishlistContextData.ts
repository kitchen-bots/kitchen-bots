import React from 'react';

export interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const WishlistContext = React.createContext<WishlistContextType | undefined>(undefined);

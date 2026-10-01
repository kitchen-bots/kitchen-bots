export type ProductCategory =
  | 'All'
  | 'Collapsible BBQ'
  | 'Rocket Stoves'
  | 'Automatic BBQ'
  | 'Santa Maria Series'
  | 'Suitcase BBQ'
  | 'Accessories';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  video?: string;
  category: ProductCategory;
  features: string[];
  specifications: Record<string, string>;
  featured?: boolean;
  warranty?: string;
  tag?: string;
  mrp?: number;
  thumbnail?: string;
  shortDescription?: string;
  specs?: ProductSpec[];
  usage?: string;
  finish?: string;
  material?: string;
  dimensions?: string;
  foldedDimensions?: string;
  cookingArea?: string;
  fuelType?: string;
  weight?: string;
  heatResistance?: string;
  cookingCapacity?: string;
  durability?: string;
  videoPath?: string;
  sequenceId?: string;
  sequenceFrameCount?: number;
  has3D?: boolean;
  hasVideo?: boolean;
  slug?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  configuration?: Record<string, string>;
}

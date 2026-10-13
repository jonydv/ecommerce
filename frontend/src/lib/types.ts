export interface HealthResponse {
  status: 'ok';
  uptime: number; // seconds since the process started
  timestamp: string; // ISO 8601
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number; // integer, in cents
  stock: number;
  imageUrl: string | null;
  createdAt: string; // in the back it's Date; JSON makes it an ISO string
  updatedAt: string;
}

export interface ProductPage {
  items: Product[];
  nextCursor: string | null;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  requestId: string;
  timestamp: string;
}

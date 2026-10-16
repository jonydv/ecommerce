// export interface Product {
//   id: string;
//   name: string;
//   slug: string;
//   description: string;
//   priceCents: number; // integer, in cents
//   stock: number;
//   imageUrl: string | null;
//   createdAt: string; // in the back it's Date; JSON makes it an ISO string
//   updatedAt: string;
// }

// export interface ProductPage {
//   items: Product[];
//   nextCursor: string | null;
// }

// export interface ApiError {
//   statusCode: number;
//   error: string;
//   message: string;
//   path: string;
//   requestId: string;
//   timestamp: string;
// }

// // Copied BY HAND from the backend (GET /auth/me). If the backend renames a field,
// // the frontend finds out at runtime, not at compile time.

// export type Role = 'CUSTOMER' | 'ADMIN';

// export interface User {
//   id: string;
//   email: string;
//   role: Role;
//   createdAt: string; // a Date in the backend; JSON turns it into a string
// }
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number; // entero, en centavos
  stock: number;
  imageUrl: string | null;
  createdAt: string; // en el back es Date; por JSON viaja como texto ISO
  updatedAt: string;
}

export interface ProductPage {
  items: Product[];
  nextCursor: string | null;
}

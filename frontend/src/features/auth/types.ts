export type Role = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string; // a Date in the backend; JSON turns it into a string
}

import 'server-only';
import type { ProductPage } from './types';
import { apiGet } from '@/shared/api/http';

export const getProducts = (limit = 12) =>
  apiGet<ProductPage>(`/products?limit=${limit}`);

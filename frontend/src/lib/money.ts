const ars = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});
export const formatPrice = (priceCents: number): string =>
  ars.format(priceCents / 100);

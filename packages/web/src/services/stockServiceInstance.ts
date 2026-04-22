import { createStockService } from '@inwealthment/shared';

// Relative base URL — Vite dev proxy and Azure Functions handle routing.
export const stockService = createStockService('');

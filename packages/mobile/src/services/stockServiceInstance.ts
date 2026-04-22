import { createStockService } from '@inwealthment/shared';

// Set EXPO_PUBLIC_API_BASE_URL in .env to point at your Azure Functions host.
// Falls back to the live Azure deployment if not set.
const baseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://ambitious-sand-0cdb1aa10.7.azurestaticapps.net';

export const stockService = createStockService(baseUrl);

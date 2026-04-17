import { SearchResult } from '../types';

/**
 * Searches internal inventory stored in Google Sheets.
 * 
 * MOCK VERSION - Returns simulated internal inventory results
 * 
 * @param query - The part number or search query
 * @returns Array of SearchResult objects matching the query
 */
// Generate a deterministic but varied price based on part number
function generatePrice(partNumber: string, basePrice: number, variance: number): string {
  let hash = 0;
  for (let i = 0; i < partNumber.length; i++) {
    hash = ((hash << 5) - hash) + partNumber.charCodeAt(i);
    hash |= 0;
  }
  const variation = (Math.abs(hash) % (variance * 100)) / 100;
  const price = basePrice + variation - (variance / 2);
  return `$${Math.max(5, price).toFixed(2)}`;
}

function generateQty(partNumber: string, baseQty: number): number {
  let hash = 0;
  for (let i = 0; i < partNumber.length; i++) {
    hash = ((hash << 3) - hash) + partNumber.charCodeAt(i);
    hash |= 0;
  }
  return Math.max(1, baseQty + (Math.abs(hash) % 30) - 15);
}

export async function searchInventory(query: string): Promise<SearchResult[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Base data that will be varied per part number
  const inventoryData = [
    { location: 'Warehouse A', condition: 'NE', baseQty: 15, basePrice: 95 },
    { location: 'Warehouse B', condition: 'NS', baseQty: 42, basePrice: 88 },
    { location: 'Consignment', condition: 'OH', baseQty: 5, basePrice: 62 },
  ];
  
  const mockInventory: SearchResult[] = inventoryData.map((data, index) => ({
    partNumber: query,
    source: `Internal Inventory - ${data.location}`,
    qty: generateQty(query + index, data.baseQty),
    condition: data.condition,
    price: generatePrice(query + index, data.basePrice, 25),
    link: '',
  }));
  
  return mockInventory;
}

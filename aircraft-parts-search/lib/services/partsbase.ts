import { SearchResult } from '../types';

/**
 * Searches the Partsbase API for aircraft parts.
 * 
 * MOCK VERSION - Returns simulated search results
 * 
 * @param query - The part number or search query
 * @returns Array of up to 5 SearchResult objects
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
  return Math.max(1, baseQty + (Math.abs(hash) % 40) - 20);
}

export async function searchPartsbase(query: string): Promise<SearchResult[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Base prices and quantities that will be varied per part number
  const mockData = [
    { condition: 'NE', baseQty: 25, basePrice: 142 },
    { condition: 'NS', baseQty: 100, basePrice: 128 },
    { condition: 'OH', baseQty: 12, basePrice: 90 },
    { condition: 'SV', baseQty: 50, basePrice: 75 },
    { condition: 'AR', baseQty: 8, basePrice: 45 },
  ];
  
  const mockResults: SearchResult[] = mockData.map((data, index) => ({
    partNumber: query,
    source: 'Partsbase',
    qty: generateQty(query + index, data.baseQty),
    condition: data.condition,
    price: generatePrice(query + index, data.basePrice, 35),
    link: `https://www.partsbase.com/search?q=${encodeURIComponent(query)}`,
  }));
  
  return mockResults;
}

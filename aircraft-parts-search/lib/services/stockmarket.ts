import { SearchResult } from '../types';

const STOCKMARKET_BASE_URL = 'https://www.stockmarket.aero';

// Generate a deterministic but varied price based on part number
function generatePrice(partNumber: string, supplierIndex: number): string {
  let hash = 0;
  const input = partNumber + supplierIndex;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  const price = 50 + (Math.abs(hash) % 450);
  return `$${price.toFixed(2)}`;
}

function generateQty(partNumber: string, supplierIndex: number): number {
  let hash = 0;
  const input = partNumber + supplierIndex;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 3) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.max(1, Math.abs(hash) % 200);
}

/**
 * Scrapes StockMarket.aero for aircraft parts listings.
 * 
 * MOCK VERSION - Returns simulated search results
 * 
 * @param query - The part number or search query
 * @returns Array of SearchResult objects
 */
export async function scrapeStockMarket(query: string): Promise<SearchResult[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock supplier names
  const suppliers = [
    'Aviall Services',
    'Boeing Distribution',
    'HEICO Aerospace',
    'Wesco Aircraft',
    'AAR Corp',
  ];
  
  const conditions = ['NE', 'NS', 'OH', 'SV', 'AR'];
  
  // Generate mock results with deterministic varied prices
  const mockResults: SearchResult[] = suppliers.map((supplier, index) => ({
    partNumber: query,
    source: `StockMarket - ${supplier}`,
    qty: generateQty(query, index),
    condition: conditions[index % conditions.length],
    price: generatePrice(query, index),
    link: `${STOCKMARKET_BASE_URL}/search?q=${encodeURIComponent(query)}`,
  }));
  
  return mockResults;
}

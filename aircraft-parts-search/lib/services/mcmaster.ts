import { SearchResult } from '../types';

const MCMASTER_BASE_URL = 'https://www.mcmaster.com';

/**
 * Scrapes McMaster-Carr for industrial parts listings.
 * 
 * MOCK VERSION - Returns simulated search results
 * 
 * @param query - The part number or search query
 * @returns Array of SearchResult objects
 */
export async function scrapeMcMaster(query: string): Promise<SearchResult[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 450));
  
  // Mock McMaster products with pack quantities
  const mockProducts = [
    { name: 'Hex Head Cap Screw', sku: '91251A540', price: '$11.38', packQty: 50 },
    { name: 'Lock Nut', sku: '90715A120', price: '$8.23', packQty: 100 },
    { name: 'Flat Washer', sku: '98023A104', price: '$4.56', packQty: 100 },
    { name: 'Split Lock Washer', sku: '92146A029', price: '$5.12', packQty: 100 },
    { name: 'Socket Head Cap Screw', sku: '91292A123', price: '$15.89', packQty: 25 },
    { name: 'Nylon-Insert Lock Nut', sku: '90631A011', price: '$9.34', packQty: 50 },
  ];
  
  const results: SearchResult[] = mockProducts.map((product) => ({
    partNumber: `${product.sku} - ${product.name}`,
    source: 'McMaster-Carr',
    qty: product.packQty,
    condition: 'New',
    price: product.price,
    link: `${MCMASTER_BASE_URL}/${product.sku}`,
  }));
  
  return results;
}

import { SearchResult } from '../types';

/**
 * Searches eBay Finding API for aircraft parts.
 * 
 * MOCK VERSION - Returns simulated search results
 * 
 * @param query - The part number or search query
 * @returns Array of SearchResult objects
 */
// Generate a deterministic but varied price based on part number
function generatePrice(partNumber: string, basePrice: number, variance: number): number {
  let hash = 0;
  for (let i = 0; i < partNumber.length; i++) {
    hash = ((hash << 5) - hash) + partNumber.charCodeAt(i);
    hash |= 0;
  }
  const variation = (Math.abs(hash) % (variance * 100)) / 100;
  return Math.max(10, basePrice + variation - (variance / 2));
}

export async function searchEbay(query: string): Promise<SearchResult[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 350));
  
  // Mock eBay listings with base prices
  const mockListings = [
    { title: `${query} - New Aircraft Hardware`, condition: 'New', basePrice: 89.99 },
    { title: `${query} Aviation Part - OEM`, condition: 'New (Other)', basePrice: 125 },
    { title: `Surplus ${query} Aircraft Component`, condition: 'Used', basePrice: 45.50 },
    { title: `${query} Certified Aircraft Part`, condition: 'New', basePrice: 199.99 },
    { title: `Lot of 5 - ${query}`, condition: 'New', basePrice: 375 },
    { title: `${query} - Overhauled with 8130`, condition: 'Seller refurbished', basePrice: 289 },
  ];
  
  const results: SearchResult[] = mockListings.map((listing, index) => {
    const price = generatePrice(query + index, listing.basePrice, 50);
    return {
      partNumber: listing.title,
      source: 'eBay',
      qty: 1,
      condition: listing.condition,
      price: `USD ${price.toFixed(2)}`,
      link: `https://www.ebay.com/itm/${123456789 + index}`,
    };
  });
  
  return results;
}

import { SearchResult } from '../types';

const LOCATORY_API_URL = 'https://api.locatory.com/v1/search/simple';

/**
 * Searches the Locatory API for aircraft parts.
 * 
 * MOCK VERSION - Returns simulated search results matching Locatory's data structure
 * 
 * Locatory returns:
 * - part_number: Part number string
 * - description: Part description
 * - condition: NE (New), NS (New Surplus), OH (Overhauled), SV (Serviceable), AR (As Removed)
 * - qty: Available quantity
 * - company: { name, country_code, city }
 * - price: Price or "RFQ" (Request for Quote)
 * - url: Direct link to listing
 * 
 * @param partNumber - The part number to search for
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
  return `$${Math.max(10, price).toFixed(2)}`;
}

function generateQty(partNumber: string, baseQty: number): number {
  let hash = 0;
  for (let i = 0; i < partNumber.length; i++) {
    hash = ((hash << 3) - hash) + partNumber.charCodeAt(i);
    hash |= 0;
  }
  return Math.max(1, baseQty + (Math.abs(hash) % 50) - 25);
}

export async function searchLocatory(partNumber: string): Promise<SearchResult[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 380));
  
  // Mock supplier data matching real Locatory suppliers
  const mockListings = [
    { 
      company: { name: 'Aviall Services Inc', country: 'US', city: 'Dallas' },
      description: 'Aircraft Hardware Component',
      condition: 'NE',
      baseQty: 45,
      basePrice: 156
    },
    { 
      company: { name: 'HEICO Aerospace Holdings', country: 'US', city: 'Hollywood' },
      description: 'Certified Replacement Part',
      condition: 'NS',
      baseQty: 120,
      basePrice: 142
    },
    { 
      company: { name: 'Wesco Aircraft Hardware', country: 'GB', city: 'London' },
      description: 'OEM Specification Part',
      condition: 'OH',
      baseQty: 8,
      basePrice: 89
    },
    { 
      company: { name: 'AAR Corp', country: 'US', city: 'Chicago' },
      description: 'Overhauled with 8130-3',
      condition: 'SV',
      baseQty: 22,
      basePrice: 0 // RFQ
    },
    { 
      company: { name: 'GA Telesis', country: 'AE', city: 'Dubai' },
      description: 'Aircraft Component - Trace Docs Available',
      condition: 'AR',
      baseQty: 3,
      basePrice: 67
    },
  ];
  
  // Generate mock results (top 5) with varied prices based on part number
  const mockResults: SearchResult[] = mockListings.slice(0, 5).map((listing, index) => ({
    partNumber: `${partNumber} - ${listing.description}`,
    source: `Locatory - ${listing.company.name} (${listing.company.country})`,
    qty: generateQty(partNumber + index, listing.baseQty),
    condition: listing.condition,
    price: listing.basePrice === 0 ? 'RFQ' : generatePrice(partNumber + index, listing.basePrice, 40),
    link: `https://www.locatory.com/search?q=${encodeURIComponent(partNumber)}`,
  }));
  
  return mockResults;
}

/*
 * REAL IMPLEMENTATION (uncomment when API key is available):
 *
 * import axios from 'axios';
 * 
 * export async function searchLocatory(partNumber: string): Promise<SearchResult[]> {
 *   const apiKey = process.env.LOCATORY_API_KEY;
 *   
 *   if (!apiKey) {
 *     console.error('LOCATORY_API_KEY is not configured');
 *     return [];
 *   }
 *   
 *   try {
 *     const response = await axios.get(LOCATORY_API_URL, {
 *       headers: {
 *         'Authorization': `Bearer ${apiKey}`,
 *         'Content-Type': 'application/json',
 *       },
 *       params: {
 *         part_number: partNumber,
 *         limit: 5,
 *       },
 *       timeout: 15000,
 *     });
 *     
 *     const data = response.data;
 *     
 *     // Map API response to SearchResult interface
 *     const results: SearchResult[] = (data.results || data.items || [])
 *       .slice(0, 5)
 *       .map((item: Record<string, unknown>): SearchResult => ({
 *         partNumber: String(item.part_number || partNumber),
 *         source: `Locatory - ${(item.company as Record<string, string>)?.name || 'Unknown Supplier'}`,
 *         qty: Number(item.qty || item.quantity || 0),
 *         condition: String(item.condition || 'Unknown'),
 *         price: String(item.price || 'Contact for price'),
 *         link: String(item.url || `https://www.locatory.com/part/${encodeURIComponent(partNumber)}`),
 *       }));
 *     
 *     return results;
 *     
 *   } catch (error) {
 *     if (axios.isAxiosError(error)) {
 *       console.error('Locatory API error:', error.response?.status, error.message);
 *     } else {
 *       console.error('Error searching Locatory:', error);
 *     }
 *     return [];
 *   }
 * }
 */

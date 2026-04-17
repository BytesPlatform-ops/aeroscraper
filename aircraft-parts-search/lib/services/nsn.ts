/**
 * Expands a part number by searching NSN-Now and extracting related NSNs
 * and manufacturer part numbers.
 * 
 * MOCK VERSION - Returns simulated expanded search terms
 * 
 * @param partNumber - The part number to search for
 * @returns Array of unique search terms including the original input
 */
export async function expandSearchTerms(partNumber: string): Promise<string[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const upperPart = partNumber.toUpperCase();
  
  // Mock expanded terms based on the input
  const mockExpansions: Record<string, string[]> = {
    'MS21042-3': ['MS21042-3', '5310-00-732-0569', 'NAS1291C3'],
    'AN3-4A': ['AN3-4A', '5306-00-225-8862', 'NAS6203-4'],
    'DEFAULT': [upperPart, `5305-01-${Math.floor(Math.random() * 999)}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`],
  };
  
  return mockExpansions[upperPart] || mockExpansions['DEFAULT'];
}

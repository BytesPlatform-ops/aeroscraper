import { NextRequest, NextResponse } from 'next/server';
import { expandSearchTerms } from '@/lib/services/nsn';
import { searchPartsbase } from '@/lib/services/partsbase';
import { scrapeStockMarket } from '@/lib/services/stockmarket';
import { searchEbay } from '@/lib/services/ebay';
import { searchLocatory } from '@/lib/services/locatory';
import { scrapeMcMaster } from '@/lib/services/mcmaster';
import { searchInventory } from '@/lib/services/googleSheets';
import { SearchResult } from '@/lib/types';

/**
 * POST /api/search
 * 
 * Searches multiple data sources for aircraft parts.
 * 
 * Request body: { 
 *   query: string,
 *   sources?: { partsbase?: boolean, stockmarket?: boolean, ebay?: boolean, locatory?: boolean, mcmaster?: boolean, inventory?: boolean }
 * }
 * Response: { results: { [source: string]: SearchResult[] } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sources } = body;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }
    
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length === 0) {
      return NextResponse.json(
        { error: 'Query cannot be empty' },
        { status: 400 }
      );
    }
    
    // Default all sources to enabled if not specified
    const enabledSources = {
      partsbase: sources?.partsbase !== false,
      stockmarket: sources?.stockmarket !== false,
      ebay: sources?.ebay !== false,
      locatory: sources?.locatory !== false,
      mcmaster: sources?.mcmaster !== false,
      inventory: sources?.inventory !== false,
    };
    
    // Expand search terms using NSN lookup
    const searchTerms = await expandSearchTerms(trimmedQuery);
    
    // Build search promises based on enabled sources
    const searchPromises: Promise<SearchResult[]>[] = [];
    
    searchTerms.forEach((term) => {
      if (enabledSources.partsbase) searchPromises.push(searchPartsbase(term));
      if (enabledSources.stockmarket) searchPromises.push(scrapeStockMarket(term));
      if (enabledSources.ebay) searchPromises.push(searchEbay(term));
      if (enabledSources.locatory) searchPromises.push(searchLocatory(term));
      if (enabledSources.mcmaster) searchPromises.push(scrapeMcMaster(term));
      if (enabledSources.inventory) searchPromises.push(searchInventory(term));
    });
    
    const searchResults = await Promise.all(searchPromises);
    
    // Flatten all results into one array
    const allResults: SearchResult[] = searchResults.flat();
    
    // Group results by source
    const groupedResults: Record<string, SearchResult[]> = {};
    
    for (const result of allResults) {
      const source = result.source || 'Unknown';
      
      if (!groupedResults[source]) {
        groupedResults[source] = [];
      }
      
      groupedResults[source].push(result);
    }
    
    // Remove duplicates within each source group (based on partNumber + link)
    for (const source of Object.keys(groupedResults)) {
      const seen = new Set<string>();
      groupedResults[source] = groupedResults[source].filter((result) => {
        const key = `${result.partNumber}|${result.link}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }
    
    return NextResponse.json({
      query: trimmedQuery,
      searchTerms,
      results: groupedResults,
      totalResults: allResults.length,
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}

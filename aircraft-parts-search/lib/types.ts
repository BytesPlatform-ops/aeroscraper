export interface SearchResult {
  partNumber: string;
  source: string;
  qty: number | string;
  condition: string;
  price: string;
  link: string;
  // Extended fields populated by real scrapers. Optional so older mock
  // services (ebay/partsbase/etc.) still satisfy the type.
  vendor?: string;
  description?: string;
  location?: string;
  nsn?: string;
  isPrimary?: boolean;
}

export interface NsnExpansion {
  primaryNsn: string;
  primaryDescription: string;
  related: Array<{ nsn: string; description: string; isPrimary: boolean }>;
}

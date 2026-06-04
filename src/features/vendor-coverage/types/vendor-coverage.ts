export type VendorCoverageRange = {
  id: number;
  maxCep: string;
  maxCepFormatted: string;
  minCep: string;
  minCepFormatted: string;
};

export type VendorCoverageSnapshot = {
  items: VendorCoverageRange[];
};

"use client";

import { RFPRequirements } from "./rfp-requirements";
import { MemoryAssist, type MemoryResult } from "./memory-assist";
import { FunderIntelligence } from "./funder-intelligence";

interface RFPSection {
  id: string;
  name: string;
  wordLimit: number;
  currentWords: number;
  isComplete: boolean;
  isActive: boolean;
}

interface FunderIntelProps {
  funderId: string;
  funderName: string;
  funderType: string;
  focusAreas: string[];
  avgGrantSize: number | null;
  grantSizeRange: {
    min: number | null;
    max: number | null;
    median: number | null;
  } | null;
  totalGiving: number | null;
  geographicFocus: string[] | null;
  applicationProcess: string | null;
  isLoading?: boolean;
}

interface LeftPanelProps {
  rfpSections: RFPSection[];
  memoryResults: MemoryResult[];
  funderInfo: FunderIntelProps;
  onSectionClick: (sectionId: string) => void;
  onMemorySearch: (query: string) => void;
  onMemoryInsert: (result: MemoryResult) => void;
  memorySearchQuery: string;
  isSearchingMemory: boolean;
}

export function LeftPanel({
  rfpSections,
  memoryResults,
  funderInfo,
  onSectionClick,
  onMemorySearch,
  onMemoryInsert,
  memorySearchQuery,
  isSearchingMemory,
}: LeftPanelProps) {
  return (
    <div className="w-80 overflow-y-auto max-h-screen space-y-4 p-4">
      {/* RFP Requirements */}
      <RFPRequirements sections={rfpSections} onSectionClick={onSectionClick} />

      {/* Memory Assist */}
      <MemoryAssist
        results={memoryResults}
        searchQuery={memorySearchQuery}
        onSearchChange={onMemorySearch}
        onInsert={onMemoryInsert}
        isSearching={isSearchingMemory}
      />

      {/* Funder Intelligence */}
      <FunderIntelligence
        funderId={funderInfo.funderId}
        funderName={funderInfo.funderName}
        funderType={funderInfo.funderType}
        focusAreas={funderInfo.focusAreas}
        avgGrantSize={funderInfo.avgGrantSize}
        grantSizeRange={funderInfo.grantSizeRange}
        totalGiving={funderInfo.totalGiving}
        geographicFocus={funderInfo.geographicFocus}
        applicationProcess={funderInfo.applicationProcess}
        isLoading={funderInfo.isLoading}
      />
    </div>
  );
}

export type { LeftPanelProps, RFPSection, FunderIntelProps, MemoryResult };

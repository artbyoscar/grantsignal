'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import { LeftPanel } from '@/components/writer/left-panel';
import { EditorPanel } from '@/components/writer/editor-panel';
import { OutlinePanel } from '@/components/writer/outline-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { MemoryResult } from '@/components/writer/memory-assist';

/**
 * AI Writer Page - V3 Trust Architecture
 * Three-panel layout: RFP Requirements | Rich Text Editor | Section Outline
 * Matches Gemini mockup (Image 6)
 */
export default function WriterPage() {
  const params = useParams();
  const router = useRouter();
  const grantId = params.grantId as string;

  // Local state
  const [content, setContent] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [memoryResults, setMemoryResults] = useState<MemoryResult[]>([]);
  const [isSearchingMemory, setIsSearchingMemory] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch grant details
  const {
    data: grant,
    isLoading: isLoadingGrant,
    error: grantError,
  } = api.writing.getGrantForWriting.useQuery(
    { grantId },
    {
      enabled: !!grantId,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch RFP sections
  const {
    data: rfpSections,
    isLoading: isLoadingRFP,
    error: rfpError,
  } = api.writing.getRFPSections.useQuery(
    { grantId },
    {
      enabled: !!grantId,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch funder intelligence
  const {
    data: funderIntelligence,
    isLoading: isLoadingFunder,
    error: funderError,
  } = api.writing.getFunderIntelligence.useQuery(
    { funderId: grant?.funderId || '' },
    {
      enabled: !!grant?.funderId,
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Fetch saved draft content
  const {
    data: draftData,
    isLoading: isLoadingDraft,
  } = api.writing.getGrantDraft.useQuery(
    { grantId },
    {
      enabled: !!grantId,
      retry: 1,
      staleTime: 1 * 60 * 1000, // 1 minute - frequent updates
    }
  );

  // Memory search state
  const [shouldSearchMemory, setShouldSearchMemory] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Memory search query
  const {
    data: memoryData,
    isLoading: isLoadingMemory,
    error: memoryError,
  } = api.writing.searchMemory.useQuery(
    {
      query: memorySearchQuery,
      organizationId: grant?.organizationId || '',
      limit: 10,
    },
    {
      enabled: shouldSearchMemory && !!grant?.organizationId && memorySearchQuery.length >= 3,
      retry: 1,
      staleTime: 30 * 1000, // Cache for 30 seconds
    }
  );

  // Update memory results when data changes
  useEffect(() => {
    if (memoryData?.results) {
      const formattedResults: MemoryResult[] = memoryData.results.map(
        (r: { documentId: string; documentName: string; text: string; score: number }, idx: number) => ({
          id: r.documentId + '_' + idx,
          source: r.documentName,
          title: r.documentName,
          relevanceScore: r.score * 100,
          excerpt: r.text,
          documentId: r.documentId,
        })
      );
      setMemoryResults(formattedResults);
    }
  }, [memoryData]);

  // Update searching state
  useEffect(() => {
    setIsSearchingMemory(isLoadingMemory);
  }, [isLoadingMemory]);

  // Handle memory search errors
  useEffect(() => {
    if (memoryError) {
      console.error('[WriterPage] Memory search error:', memoryError);
      setMemoryResults([]);
      setIsSearchingMemory(false);
    }
  }, [memoryError]);

  // Handle memory search with debouncing
  const handleMemorySearch = useCallback(
    (query: string) => {
      setMemorySearchQuery(query);

      // Clear previous timer
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      if (!query.trim() || !grant?.organizationId) {
        setMemoryResults([]);
        setIsSearchingMemory(false);
        setShouldSearchMemory(false);
        return;
      }

      if (query.length < 3) {
        setMemoryResults([]);
        setShouldSearchMemory(false);
        return;
      }

      // Debounce search
      const timer = setTimeout(() => {
        setShouldSearchMemory(true);
        setIsSearchingMemory(true);
      }, 300);

      setSearchDebounceTimer(timer);
    },
    [grant?.organizationId, searchDebounceTimer]
  );

  // Handle memory result insertion
  const handleMemoryInsert = useCallback(
    (result: MemoryResult) => {
      // Insert excerpt at cursor position
      const insertion = `\n\n${result.excerpt}\n\n[Source: ${result.source}]\n\n`;
      setContent((prev) => prev + insertion);
    },
    []
  );

  // Save content mutation
  const saveContentMutation = api.writing.saveContent.useMutation({
    onSuccess: () => {
      console.log('[WriterPage] Content saved successfully');
    },
    onError: (error) => {
      console.error('[WriterPage] Failed to save content:', error);
    },
  });

  // Handle content change with auto-save
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);

      // Clear previous auto-save timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      // Auto-save after 2 seconds of inactivity
      if (activeSection) {
        const timer = setTimeout(() => {
          saveContentMutation.mutate({
            grantId,
            sectionName: activeSection,
            content: newContent,
            isAiGenerated: false,
          });
        }, 2000);

        setAutoSaveTimer(timer);
      }
    },
    [activeSection, grantId, autoSaveTimer, saveContentMutation]
  );

  // Calculate word count
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  // Handle section click
  const handleSectionClick = useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId);

      // Load section content from draft if available
      if (draftData?.sections?.[sectionId]) {
        setContent(draftData.sections[sectionId].content || '');
      } else {
        setContent('');
      }
    },
    [draftData]
  );

  // Loading state
  const isLoading = isLoadingGrant || isLoadingRFP || isLoadingFunder || isLoadingDraft;

  // Error state
  const error = grantError || rfpError || funderError;

  // Error boundary
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Error Loading Writer</AlertTitle>
          <AlertDescription className="mt-2">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </AlertDescription>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => router.push('/grants')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Grants
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="h-screen bg-[#0f172a] flex">
        {/* Left Panel Skeleton */}
        <div className="w-80 border-r border-slate-700 p-4 space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4 bg-slate-800" />
            <Skeleton className="h-24 w-full bg-slate-800" />
            <Skeleton className="h-24 w-full bg-slate-800" />
          </div>
          <div className="space-y-3 mt-6">
            <Skeleton className="h-8 w-2/3 bg-slate-800" />
            <Skeleton className="h-32 w-full bg-slate-800" />
          </div>
          <div className="space-y-3 mt-6">
            <Skeleton className="h-8 w-2/3 bg-slate-800" />
            <Skeleton className="h-24 w-full bg-slate-800" />
          </div>
        </div>

        {/* Center Panel Skeleton */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-10 w-full bg-slate-800" />
            <Skeleton className="h-96 w-full bg-slate-800" />
          </div>
        </div>

        {/* Right Panel Skeleton */}
        <div className="w-80 border-l border-slate-700 p-4 space-y-3">
          <Skeleton className="h-8 w-3/4 bg-slate-800" />
          <Skeleton className="h-16 w-full bg-slate-800" />
          <Skeleton className="h-16 w-full bg-slate-800" />
          <Skeleton className="h-16 w-full bg-slate-800" />
        </div>

        {/* Loading Indicator */}
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-slate-300">Loading writer...</span>
        </div>
      </div>
    );
  }

  // Transform RFP sections for LeftPanel
  interface RFPSection {
    id: string;
    name: string;
    wordLimit: number;
    description?: string;
  }

  const transformedRFPSections =
    rfpSections?.map((section: RFPSection) => {
      const sectionContent = draftData?.sections?.[section.id]?.content || '';
      const sectionWordCount = sectionContent.trim().split(/\s+/).filter(Boolean).length;
      const wordLimit = section.wordLimit || 1000;

      return {
        id: section.id,
        name: section.name,
        wordLimit,
        currentWords: sectionWordCount,
        isComplete: sectionWordCount >= wordLimit * 0.9, // 90% threshold
        isActive: activeSection === section.id,
      };
    }) || [];

  // Transform funder intelligence for LeftPanel
  const transformedFunderInfo = funderIntelligence
    ? {
        funderName: funderIntelligence.name,
        focus: funderIntelligence.focusAreas || [],
        avgGrantSize: funderIntelligence.avgGrantSize || 0,
        keyPriorities: funderIntelligence.priorities?.programAreas || [],
      }
    : {
        funderName: 'Loading...',
        focus: [],
        avgGrantSize: 0,
        keyPriorities: [],
      };

  return (
    <div className="h-screen bg-[#0f172a] flex overflow-hidden">
      {/* Left Panel: RFP Requirements + Memory Assist + Funder Intelligence */}
      <div className="w-80 border-r border-slate-700 overflow-y-auto">
        <LeftPanel
          rfpSections={transformedRFPSections}
          memoryResults={memoryResults}
          funderInfo={transformedFunderInfo}
          onSectionClick={handleSectionClick}
          onMemorySearch={handleMemorySearch}
          onMemoryInsert={handleMemoryInsert}
          memorySearchQuery={memorySearchQuery}
          isSearchingMemory={isSearchingMemory}
        />
      </div>

      {/* Center Panel: Rich Text Editor */}
      <div className="flex-1 overflow-y-auto relative">
        <EditorPanel
          content={content}
          onChange={handleContentChange}
          activeSection={activeSection}
        />

        {/* Word Count & Auto-save Indicator */}
        <div className="absolute bottom-4 right-4 flex items-center gap-4 px-4 py-2 bg-slate-800/90 backdrop-blur rounded-lg shadow-lg">
          <div className="text-sm text-slate-300">
            <span className="font-medium">{wordCount}</span> words
            {activeSection && transformedRFPSections.find((s: { id: string }) => s.id === activeSection) && (
              <span className="text-slate-500 ml-1">
                / {transformedRFPSections.find((s: { id: string }) => s.id === activeSection)?.wordLimit || 0}
              </span>
            )}
          </div>
          {saveContentMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {!saveContentMutation.isPending && autoSaveTimer && (
            <div className="text-sm text-slate-500">
              Draft
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Section Outline */}
      <div className="w-80 border-l border-slate-700 overflow-y-auto">
        <OutlinePanel
          activeSection={activeSection}
          onSectionSelect={setActiveSection}
        />
      </div>
    </div>
  );
}

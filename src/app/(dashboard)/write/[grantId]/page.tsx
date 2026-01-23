'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import { Loader2, ArrowLeft, Check, Cloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RFPRequirements } from '@/components/writer/rfp-requirements';
import { FunderIntelligence } from '@/components/writer/funder-intelligence';
import { MemorySearch } from '@/components/writing/memory-search';
import { GrantEditor } from '@/components/writer/grant-editor';
import { AIToolbar } from '@/components/writer/ai-toolbar';
import { OutlinePanel } from '@/components/writer/outline-panel';
import { STANDARD_SECTIONS, calculateWordCount } from '@/lib/writer/sections';

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

interface PageProps {
  params: Promise<{
    grantId: string;
  }>;
}

export default function WriterPage({ params }: PageProps) {
  const { grantId } = use(params);
  const router = useRouter();

  // State Management
  const [editorContent, setEditorContent] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [sectionContents, setSectionContents] = useState<Record<string, string>>({});
  const [highlightedText, setHighlightedText] = useState<{ start: number; end: number; color: string } | undefined>();

  // Fetch grant data
  const { data: rawGrant, isLoading: isLoadingGrant } = api.grants.byId.useQuery({
    id: grantId,
  });

  // Transform Decimal to number at the boundary
  const grant = rawGrant ? {
    ...rawGrant,
    amountRequested: rawGrant.amountRequested ? Number(rawGrant.amountRequested) : null,
    amountAwarded: rawGrant.amountAwarded ? Number(rawGrant.amountAwarded) : null,
  } : null;

  // Fetch funder intelligence data
  const { data: funderIntelligence, isLoading: isLoadingFunder } = api.writing.getFunderIntelligence.useQuery(
    {
      funderId: grant?.funderId || '',
    },
    {
      enabled: !!grant?.funderId, // Only fetch if we have a funderId
    }
  );

  // Save status tracking
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Save draft mutation
  const saveDraft = api.grants.saveDraft.useMutation({
    onSuccess: () => {
      setSaveStatus('saved');
    },
    onError: (error) => {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
      setSaveStatus('unsaved');
    },
  });

  // Parse RFP sections from grant opportunity requirements
  const rfpSections: RFPSection[] = grant?.opportunity?.requirements
    ? (grant.opportunity.requirements as any[]).map((req: any, idx: number) => {
        const sectionName = req.section || `Section ${idx + 1}`;
        const content = sectionContents[sectionName] || '';
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

        return {
          id: String(idx),
          name: sectionName,
          wordLimit: req.wordLimit || 1000,
          currentWords: wordCount,
          isComplete: req.required ? wordCount >= (req.wordLimit || 1000) * 0.9 : false,
          isActive: activeSection === sectionName,
        };
      })
    : [];

  // Prepare funder intelligence data
  const funderInfo: FunderIntelProps = funderIntelligence
    ? {
        funderId: funderIntelligence.id,
        funderName: funderIntelligence.name,
        funderType: funderIntelligence.type,
        focusAreas: funderIntelligence.focusAreas || [],
        avgGrantSize: funderIntelligence.avgGrantSize,
        grantSizeRange: funderIntelligence.priorities.grantSizeRange,
        totalGiving: funderIntelligence.totalGiving,
        geographicFocus: parseGeographicFocus(funderIntelligence.priorities.geographicFocus),
        applicationProcess: funderIntelligence.priorities.applicationProcess,
        isLoading: isLoadingFunder,
      }
    : {
        // Fallback data when funder intelligence is loading or not available
        funderId: grant?.funderId || '',
        funderName: grant?.funder?.name || 'Unknown Funder',
        funderType: grant?.funder?.type || 'OTHER',
        focusAreas: [],
        avgGrantSize: null,
        grantSizeRange: null,
        totalGiving: null,
        geographicFocus: null,
        applicationProcess: null,
        isLoading: isLoadingFunder,
      };

  // Helper function to parse geographicFocus JSON to string array
  function parseGeographicFocus(geoFocus: any): string[] | null {
    if (!geoFocus) return null;

    // If it's already an array of strings, return it
    if (Array.isArray(geoFocus)) {
      return geoFocus.filter(item => typeof item === 'string');
    }

    // If it's an object with areas/regions/states properties, extract them
    if (typeof geoFocus === 'object') {
      const areas = geoFocus.areas || geoFocus.regions || geoFocus.states || geoFocus.locations;
      if (Array.isArray(areas)) {
        return areas.filter(item => typeof item === 'string');
      }
      // If it's an object with key-value pairs, return the values
      return Object.values(geoFocus).filter(item => typeof item === 'string') as string[];
    }

    return null;
  }

  // Initialize section contents from grant draftContent
  useEffect(() => {
    if (grant?.draftContent && Object.keys(sectionContents).length === 0) {
      const draftContent = grant.draftContent as Record<string, any>;
      const initialContents: Record<string, string> = {};

      STANDARD_SECTIONS.forEach((section) => {
        const sectionData = draftContent[section.id];
        if (sectionData && typeof sectionData === 'object' && 'content' in sectionData) {
          initialContents[section.id] = sectionData.content || '';
        } else if (typeof sectionData === 'string') {
          initialContents[section.id] = sectionData;
        } else {
          initialContents[section.id] = '';
        }
      });

      setSectionContents(initialContents);
    }
  }, [grant?.draftContent]);

  // Initialize first section
  useEffect(() => {
    if (STANDARD_SECTIONS.length > 0 && !activeSection) {
      setActiveSection(STANDARD_SECTIONS[0].id);
    }
  }, [activeSection]);

  // Update editor content when active section changes
  useEffect(() => {
    if (activeSection) {
      setEditorContent(sectionContents[activeSection] || '');
    }
  }, [activeSection, sectionContents]);

  // Auto-save draft content (debounced)
  useEffect(() => {
    if (!activeSection) return;

    // Mark as unsaved when content changes
    setSaveStatus('unsaved');

    const timeoutId = setTimeout(() => {
      setSaveStatus('saving');
      const wordCount = calculateWordCount(editorContent);
      saveDraft.mutate({
        id: grantId,
        sectionId: activeSection,
        content: editorContent || '',
        wordCount,
      });
    }, 2000); // Save 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [editorContent, activeSection, grantId]);

  // Handlers
  const handleSectionClick = (sectionId: string) => {
    // Find section by id
    const section = rfpSections.find(s => s.id === sectionId);
    if (section) {
      // Save current section content before switching
      if (activeSection) {
        setSectionContents(prev => ({
          ...prev,
          [activeSection]: editorContent,
        }));
      }
      setActiveSection(section.name);
    }
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    // Update section contents
    if (activeSection) {
      setSectionContents(prev => ({
        ...prev,
        [activeSection]: content,
      }));
    }
  };

  const handleMemoryInsert = (text: string, source: { documentId: string; documentName: string }) => {
    const insertText = `\n\n[Source: ${source.documentName}]\n${text}\n`;
    const newContent = editorContent + insertText;
    setEditorContent(newContent);

    // Update section contents
    if (activeSection) {
      setSectionContents(prev => ({
        ...prev,
        [activeSection]: newContent,
      }));
    }

    // Highlight the inserted text
    const start = editorContent.length;
    const end = newContent.length;
    setHighlightedText({ start, end, color: 'blue' });

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedText(undefined);
    }, 3000);
  };

  const handleAskClaude = (prompt: string) => {
    if (!prompt.trim()) return;

    setIsStreaming(true);
    setAiSuggestion(`Processing: "${prompt}"`);

    // Simulate AI response
    setTimeout(() => {
      const mockResponse = 'Consider emphasizing the measurable impact and sustainability of your program. Include specific data points and timelines.';
      setAiSuggestion(mockResponse);
      setIsStreaming(false);

      // Auto-clear suggestion after 10 seconds
      setTimeout(() => {
        setAiSuggestion(undefined);
      }, 10000);
    }, 2000);
  };

  const handleSuggestImprovements = () => {
    if (!editorContent.trim()) {
      toast.error('Please write some content first');
      return;
    }

    setIsStreaming(true);
    setAiSuggestion('Analyzing your content for improvements...');

    setTimeout(() => {
      setAiSuggestion('Consider adding more specific metrics and concrete examples to strengthen your narrative.');
      setIsStreaming(false);
    }, 1500);
  };

  const handleCheckTone = () => {
    if (!editorContent.trim()) {
      toast.error('Please write some content first');
      return;
    }

    setIsStreaming(true);
    setAiSuggestion('Checking tone and consistency...');

    setTimeout(() => {
      setAiSuggestion('Tone is professional and consistent. Consider varying sentence structure for better readability.');
      setIsStreaming(false);
    }, 1500);
  };

  const handleFindStatistics = () => {
    setIsStreaming(true);
    setAiSuggestion('Searching for relevant statistics...');

    setTimeout(() => {
      setAiSuggestion('Found relevant statistics: "According to recent studies, programs like yours show 85% success rate in community engagement."');
      setIsStreaming(false);
    }, 1500);
  };

  const handleSectionSelect = (sectionId: string) => {
    // Save current section content before switching
    if (activeSection) {
      setSectionContents(prev => ({
        ...prev,
        [activeSection]: editorContent,
      }));
    }
    setActiveSection(sectionId);
  };

  // Loading state
  if (isLoadingGrant) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Grant not found
  if (!grant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-slate-900">
        <p className="text-slate-400">Grant not found</p>
        <Button onClick={() => router.push('/pipeline')}>Back to Pipeline</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Left Panel - 320px */}
      <div className="w-80 shrink-0 border-r border-slate-800 overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/pipeline')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </Button>
        </div>
        <div className="p-4 space-y-4">
          {/* RFP Requirements */}
          <RFPRequirements sections={rfpSections} onSectionClick={handleSectionClick} />

          {/* Memory Assist - Real search component */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">Memory Assist</h3>
            </div>
            <div className="h-[400px]">
              <MemorySearch onInsert={handleMemoryInsert} />
            </div>
          </div>

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
      </div>

      {/* Center Panel - Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {grant.opportunity?.title || 'Untitled Grant'}
              </h1>
              <p className="text-sm text-slate-400 truncate">
                {grant.funder?.name || 'Unknown Funder'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-slate-400">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-slate-400">Saved</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <>
                  <Cloud className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-500">Unsaved</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <GrantEditor
            content={editorContent}
            onChange={handleEditorChange}
            activeSection={activeSection || undefined}
            highlightedText={highlightedText}
          />
        </div>

        {/* AI Toolbar */}
        <AIToolbar
          onAskClaude={handleAskClaude}
          onSuggestImprovements={handleSuggestImprovements}
          onCheckTone={handleCheckTone}
          onFindStatistics={handleFindStatistics}
          suggestion={aiSuggestion}
          isStreaming={isStreaming}
        />
      </div>

      {/* Right Panel - Outline - 200px */}
      <div className="w-52 shrink-0 border-l border-slate-800 p-4">
        <OutlinePanel
          activeSection={activeSection}
          onSectionSelect={handleSectionSelect}
          sectionContents={sectionContents}
        />
      </div>
    </div>
  );
}

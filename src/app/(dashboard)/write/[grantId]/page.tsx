'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LeftPanel, type RFPSection, type FunderIntelProps, type MemoryResult } from '@/components/writer/left-panel';
import { GrantEditor } from '@/components/writer/grant-editor';
import { AIToolbar } from '@/components/writer/ai-toolbar';
import { OutlinePanel } from '@/components/writer/outline-panel';

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
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [memoryResults, setMemoryResults] = useState<MemoryResult[]>([]);
  const [isSearchingMemory, setIsSearchingMemory] = useState(false);
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
  const funderInfo: FunderIntelProps = {
    funderName: grant?.funder?.name || 'Unknown Funder',
    focus: grant?.funder?.type ? [grant.funder.type.replace(/_/g, ' ')] : ['General'],
    avgGrantSize: grant?.funder?.grantSizeMin ? Number(grant.funder.grantSizeMin) : 50000,
    keyPriorities: [
      'Measurable outcomes',
      'Community impact',
      'Sustainability plan',
    ],
  };

  // Initialize first section
  useEffect(() => {
    if (rfpSections.length > 0 && !activeSection) {
      setActiveSection(rfpSections[0].name);
    }
  }, [rfpSections.length, activeSection]);

  // Update editor content when active section changes
  useEffect(() => {
    if (activeSection) {
      setEditorContent(sectionContents[activeSection] || '');
    }
  }, [activeSection, sectionContents]);

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

  const handleMemorySearch = (query: string) => {
    setMemorySearchQuery(query);
    if (query.trim().length < 3) {
      setMemoryResults([]);
      return;
    }

    // Simulate memory search with debounce
    setIsSearchingMemory(true);
    setTimeout(() => {
      // Mock results - replace with actual API call
      setMemoryResults([
        {
          id: '1',
          source: 'Previous Grant Proposal',
          title: 'Similar content from past proposals',
          relevanceScore: 92,
          excerpt: 'Our organization has a proven track record of implementing community programs that have impacted over 5,000 individuals...',
          documentId: 'doc-1',
        },
        {
          id: '2',
          source: 'Impact Report 2023',
          title: 'Impact metrics',
          relevanceScore: 85,
          excerpt: 'In 2023, we achieved a 95% participant satisfaction rate and exceeded our goals by 120%...',
          documentId: 'doc-2',
        },
      ]);
      setIsSearchingMemory(false);
    }, 800);
  };

  const handleMemoryInsert = (result: MemoryResult) => {
    const insertText = `\n\n[From ${result.source}]\n${result.excerpt}\n`;
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

    toast.success(`Inserted content from ${result.source}`);

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

  const handleSectionSelect = (section: string) => {
    // Save current section content before switching
    if (activeSection) {
      setSectionContents(prev => ({
        ...prev,
        [activeSection]: editorContent,
      }));
    }
    setActiveSection(section);
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
      <div className="w-80 shrink-0 border-r border-slate-800 p-4 overflow-y-auto">
        <div className="mb-4">
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
        <LeftPanel
          rfpSections={rfpSections}
          memoryResults={memoryResults}
          funderInfo={funderInfo}
          onSectionClick={handleSectionClick}
          onMemorySearch={handleMemorySearch}
          onMemoryInsert={handleMemoryInsert}
          memorySearchQuery={memorySearchQuery}
          isSearchingMemory={isSearchingMemory}
        />
      </div>

      {/* Center Panel - Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800">
          <h1 className="text-xl font-bold text-white truncate">
            {grant.opportunity?.title || 'Untitled Grant'}
          </h1>
          <p className="text-sm text-slate-400 truncate">
            {grant.funder?.name || 'Unknown Funder'}
          </p>
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
        />
      </div>
    </div>
  );
}

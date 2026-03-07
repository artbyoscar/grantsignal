'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import {
  Loader2, ArrowLeft, ArrowRight, Check, Cloud,
  Sparkles, ChevronLeft, ChevronRight, Wand2,
  CheckCircle, AlertTriangle, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RFPRequirements } from '@/components/writer/rfp-requirements';
import { FunderIntelligence } from '@/components/writer/funder-intelligence';
import { MemorySearch } from '@/components/writing/memory-search';
import { GrantEditor } from '@/components/writer/grant-editor';
import { AIToolbar } from '@/components/writer/ai-toolbar';
import { OutlinePanel } from '@/components/writer/outline-panel';
import { ComplianceMonitor } from '@/components/writing/compliance-monitor';
import { AIGenerationPanel, Source as AISource } from '@/components/writing/ai-generation-panel';
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
  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<'assist' | 'editor' | 'outline'>('editor');
  // AI Generation Panel state
  const [showGenerationPanel, setShowGenerationPanel] = useState(false);
  // Guided mode state
  const [guidedMode, setGuidedMode] = useState(false);
  // Source attribution for last AI generation
  const [lastAISources, setLastAISources] = useState<AISource[]>([]);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);

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
      enabled: !!grant?.funderId,
    }
  );

  // Save status tracking
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Compliance monitoring state
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const checkComplianceMutation = api.writing.checkCompliance.useMutation({
    onSuccess: (data) => {
      setComplianceResult(data);
      if (data.summary.overallStatus === 'critical') {
        toast.error(data.summary.message);
      } else if (data.summary.overallStatus === 'warning') {
        toast.warning(data.summary.message);
      } else {
        toast.success(data.summary.message);
      }
    },
    onError: (error) => {
      toast.error(`Compliance check failed: ${error.message}`);
    },
  });

  const handleComplianceCheck = () => {
    if (!editorContent || editorContent.trim().length < 50) {
      toast.error('Write at least 50 characters before running a compliance check.');
      return;
    }
    checkComplianceMutation.mutate({
      grantId,
      content: editorContent,
      sectionName: activeSection || 'unknown',
    });
  };

  // Save draft mutation
  const saveDraft = api.grants.saveDraft.useMutation({
    onSuccess: () => {
      setSaveStatus('saved');
    },
    onError: () => {
      toast.error('Failed to save draft');
      setSaveStatus('unsaved');
    },
  });

  // Real AI generation mutation for toolbar actions
  const generateDraftMutation = api.writing.generateDraft.useMutation({
    onSuccess: (data) => {
      setIsStreaming(false);
      if (data.shouldGenerate && data.content) {
        setAiSuggestion(data.content);
        setLastAISources(data.sources);
        setLastConfidence(data.confidence);
        toast.success(`Generated with ${data.confidence}% confidence from ${data.sources.length} sources`);
      } else {
        setAiSuggestion(data.message || 'Confidence too low to generate. Try adding more documents.');
        setLastAISources(data.sources);
        setLastConfidence(data.confidence);
        toast.warning(`Low confidence (${data.confidence}%). Review available sources.`);
      }
    },
    onError: (error) => {
      setIsStreaming(false);
      setAiSuggestion(undefined);
      toast.error(`AI generation failed: ${error.message}`);
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

    if (Array.isArray(geoFocus)) {
      return geoFocus.filter(item => typeof item === 'string');
    }

    if (typeof geoFocus === 'object') {
      const areas = geoFocus.areas || geoFocus.regions || geoFocus.states || geoFocus.locations;
      if (Array.isArray(areas)) {
        return areas.filter(item => typeof item === 'string');
      }
      return Object.values(geoFocus).filter(item => typeof item === 'string') as string[];
    }

    return null;
  }

  // Guided mode: current section index and navigation
  const activeSectionIndex = useMemo(() => {
    if (!activeSection) return 0;
    const idx = STANDARD_SECTIONS.findIndex(s => s.id === activeSection);
    return idx >= 0 ? idx : 0;
  }, [activeSection]);

  const canGoBack = activeSectionIndex > 0;
  const canGoForward = activeSectionIndex < STANDARD_SECTIONS.length - 1;
  const currentSectionDef = STANDARD_SECTIONS[activeSectionIndex];
  const currentWordCount = calculateWordCount(editorContent);

  const handleGuidedNext = () => {
    if (!canGoForward) return;
    // Save current before switching
    if (activeSection) {
      setSectionContents(prev => ({ ...prev, [activeSection]: editorContent }));
    }
    setActiveSection(STANDARD_SECTIONS[activeSectionIndex + 1].id);
  };

  const handleGuidedPrev = () => {
    if (!canGoBack) return;
    if (activeSection) {
      setSectionContents(prev => ({ ...prev, [activeSection]: editorContent }));
    }
    setActiveSection(STANDARD_SECTIONS[activeSectionIndex - 1].id);
  };

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
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [editorContent, activeSection, grantId]);

  // Handlers
  const handleSectionClick = (sectionId: string) => {
    const section = rfpSections.find(s => s.id === sectionId);
    if (section) {
      if (activeSection) {
        setSectionContents(prev => ({ ...prev, [activeSection]: editorContent }));
      }
      setActiveSection(section.name);
    }
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    if (activeSection) {
      setSectionContents(prev => ({ ...prev, [activeSection]: content }));
    }
  };

  const handleMemoryInsert = (text: string, source: { documentId: string; documentName: string }) => {
    const insertText = `\n\n[Source: ${source.documentName}]\n${text}\n`;
    const newContent = editorContent + insertText;
    setEditorContent(newContent);

    if (activeSection) {
      setSectionContents(prev => ({ ...prev, [activeSection]: newContent }));
    }

    const start = editorContent.length;
    const end = newContent.length;
    setHighlightedText({ start, end, color: 'blue' });

    setTimeout(() => {
      setHighlightedText(undefined);
    }, 3000);
  };

  // REAL AI HANDLERS - wired to writing.generateDraft tRPC mutation
  const handleAskClaude = (prompt: string) => {
    if (!prompt.trim()) return;

    const sectionName = currentSectionDef?.title || activeSection || 'General';
    setIsStreaming(true);
    setAiSuggestion(`Retrieving org memory and generating response...`);

    generateDraftMutation.mutate({
      grantId,
      sectionName,
      prompt,
      mode: 'memory_assist',
    });
  };

  const handleSuggestImprovements = () => {
    if (!editorContent.trim()) {
      toast.error('Please write some content first');
      return;
    }

    const sectionName = currentSectionDef?.title || activeSection || 'General';
    setIsStreaming(true);
    setAiSuggestion('Analyzing content for improvements...');

    generateDraftMutation.mutate({
      grantId,
      sectionName,
      prompt: `Review the following draft content and suggest specific improvements. Focus on strengthening the narrative, adding concrete metrics, and improving clarity:\n\n${editorContent.slice(0, 2000)}`,
      mode: 'memory_assist',
    });
  };

  const handleCheckTone = () => {
    if (!editorContent.trim()) {
      toast.error('Please write some content first');
      return;
    }

    const sectionName = currentSectionDef?.title || activeSection || 'General';
    setIsStreaming(true);
    setAiSuggestion('Analyzing tone and voice consistency...');

    generateDraftMutation.mutate({
      grantId,
      sectionName,
      prompt: `Analyze the tone, voice, and consistency of this grant writing. Check if it matches our organizational voice and suggest any adjustments for professionalism, clarity, and funder alignment:\n\n${editorContent.slice(0, 2000)}`,
      mode: 'memory_assist',
    });
  };

  const handleFindStatistics = () => {
    const sectionName = currentSectionDef?.title || activeSection || 'General';
    setIsStreaming(true);
    setAiSuggestion('Searching organizational memory for relevant statistics...');

    generateDraftMutation.mutate({
      grantId,
      sectionName,
      prompt: `Search our organizational documents and memory for relevant statistics, data points, metrics, and evidence that would strengthen the "${sectionName}" section of this grant proposal. Return specific numbers, percentages, and outcomes from our past work.`,
      mode: 'memory_assist',
    });
  };

  // AI Generation Panel: accept generated content
  const handleAcceptGenerated = (content: string, sources: AISource[]) => {
    const sourceAttribution = sources.map(s => `[Source: ${s.documentName} (${s.score}% match)]`).join('\n');
    const insertText = `\n\n${content}\n\n---\n${sourceAttribution}\n`;
    const newContent = editorContent + insertText;
    setEditorContent(newContent);

    if (activeSection) {
      setSectionContents(prev => ({ ...prev, [activeSection]: newContent }));
    }

    setLastAISources(sources);
    setShowGenerationPanel(false);

    const start = editorContent.length;
    const end = newContent.length;
    setHighlightedText({ start, end, color: 'blue' });

    setTimeout(() => {
      setHighlightedText(undefined);
    }, 5000);

    toast.success('AI-generated content inserted with source attribution');
  };

  // Apply AI suggestion to editor
  const handleApplySuggestion = () => {
    if (!aiSuggestion || !lastConfidence || lastConfidence < 60) return;

    const sourceAttribution = lastAISources.length > 0
      ? `\n\n---\nSources: ${lastAISources.map(s => `${s.documentName} (${s.score}%)`).join(', ')}`
      : '';

    const insertText = `\n\n${aiSuggestion}${sourceAttribution}\n`;
    const newContent = editorContent + insertText;
    setEditorContent(newContent);

    if (activeSection) {
      setSectionContents(prev => ({ ...prev, [activeSection]: newContent }));
    }

    setAiSuggestion(undefined);
    setLastAISources([]);
    setLastConfidence(null);

    toast.success('AI content applied to editor');
  };

  const handleSectionSelect = (sectionId: string) => {
    if (activeSection) {
      setSectionContents(prev => ({ ...prev, [activeSection]: editorContent }));
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
      {/* AI Generation Panel Modal */}
      {showGenerationPanel && (
        <AIGenerationPanel
          grantId={grantId}
          sectionName={currentSectionDef?.title || activeSection || 'General'}
          onAccept={handleAcceptGenerated}
          onClose={() => setShowGenerationPanel(false)}
        />
      )}

      {/* Mobile Header with Back Button - Only visible on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-slate-800 border-b border-slate-700 h-14 flex items-center px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/pipeline')}
          className="gap-1 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs">Back</span>
        </Button>
        <div className="flex-1 text-center px-2">
          <h1 className="text-sm font-semibold text-white truncate">
            {grant.opportunity?.title || 'Untitled Grant'}
          </h1>
        </div>
        <div className="w-16 shrink-0" />
      </div>

      {/* Mobile Tab Bar - Only visible on mobile */}
      <div className="md:hidden fixed top-14 left-0 right-0 z-20 bg-slate-800 border-b border-slate-700">
        <div className="flex">
          <button
            onClick={() => setMobileTab('assist')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors touch-manipulation ${
              mobileTab === 'assist'
                ? 'text-blue-400 bg-blue-600/20 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200 active:bg-slate-700'
            }`}
          >
            Assist
          </button>
          <button
            onClick={() => setMobileTab('editor')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors touch-manipulation ${
              mobileTab === 'editor'
                ? 'text-blue-400 bg-blue-600/20 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200 active:bg-slate-700'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setMobileTab('outline')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors touch-manipulation ${
              mobileTab === 'outline'
                ? 'text-blue-400 bg-blue-600/20 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200 active:bg-slate-700'
            }`}
          >
            Progress
          </button>
        </div>
      </div>

      {/* Left Panel - 320px - Hidden on mobile unless active tab */}
      <div className={`w-80 shrink-0 border-r border-slate-800 overflow-y-auto ${
        mobileTab === 'assist' ? 'block md:block' : 'hidden md:block'
      } md:relative fixed inset-0 z-10 md:z-auto pt-28 md:pt-0 pb-24 md:pb-0`}>
        <div className="hidden md:block p-4 border-b border-slate-800">
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

      {/* Center Panel - Editor - Hidden on mobile unless active tab */}
      <div className={`flex-1 flex flex-col ${
        mobileTab === 'editor' ? 'flex md:flex' : 'hidden md:flex'
      } md:relative fixed inset-0 z-10 md:z-auto pt-28 md:pt-0`}>
        {/* Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-800 bg-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-xl font-bold text-white truncate">
                {grant.opportunity?.title || 'Untitled Grant'}
              </h1>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                {grant.funder?.name || 'Unknown Funder'}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3 text-sm">
              {/* Guided Mode Toggle */}
              <button
                onClick={() => setGuidedMode(!guidedMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  guidedMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                {guidedMode ? 'Guided Mode' : 'Free Mode'}
              </button>
              {/* Generate Draft Button */}
              <Button
                size="sm"
                onClick={() => setShowGenerationPanel(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Draft
              </Button>
              {/* Save Status */}
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

          {/* Guided Mode Section Navigator */}
          {guidedMode && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleGuidedPrev}
                disabled={!canGoBack}
                className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {currentSectionDef?.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    Section {activeSectionIndex + 1} of {STANDARD_SECTIONS.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (currentWordCount / (currentSectionDef?.targetWordCount || 500)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {currentWordCount} / {currentSectionDef?.targetWordCount} words
                  </span>
                </div>
                {currentSectionDef?.description && (
                  <p className="text-xs text-slate-500 mt-1">{currentSectionDef.description}</p>
                )}
              </div>
              <button
                onClick={handleGuidedNext}
                disabled={!canGoForward}
                className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Confidence & Source Attribution Banner */}
        {lastConfidence !== null && lastAISources.length > 0 && (
          <div className={`px-4 md:px-6 py-2 border-b flex items-center gap-3 ${
            lastConfidence >= 80 ? 'bg-green-900/20 border-green-800' :
            lastConfidence >= 60 ? 'bg-amber-900/20 border-amber-800' :
            'bg-red-900/20 border-red-800'
          }`}>
            {lastConfidence >= 80 ? (
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : lastConfidence >= 60 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-medium ${
                lastConfidence >= 80 ? 'text-green-400' :
                lastConfidence >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {lastConfidence}% confidence
              </span>
              <span className="text-xs text-slate-400 ml-2">
                from {lastAISources.length} source{lastAISources.length !== 1 ? 's' : ''}:
                {' '}{lastAISources.slice(0, 3).map(s => s.documentName).join(', ')}
                {lastAISources.length > 3 ? ` +${lastAISources.length - 3} more` : ''}
              </span>
            </div>
            {lastConfidence >= 60 && aiSuggestion && (
              <Button size="sm" variant="outline" onClick={handleApplySuggestion} className="text-xs shrink-0">
                Apply to Editor
              </Button>
            )}
            <button
              onClick={() => { setLastAISources([]); setLastConfidence(null); }}
              className="text-slate-500 hover:text-slate-300 text-xs shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 md:pb-6">
          <GrantEditor
            content={editorContent}
            onChange={handleEditorChange}
            activeSection={activeSection || undefined}
            highlightedText={highlightedText}
          />
        </div>

        {/* Compliance Monitor */}
        <div className="px-4 md:px-6 hidden md:block">
          <ComplianceMonitor
            grantId={grantId}
            sectionName={activeSection || 'unknown'}
            result={complianceResult}
            isChecking={checkComplianceMutation.isPending}
            onCheck={handleComplianceCheck}
          />
        </div>

        {/* Guided Mode Footer Navigation */}
        {guidedMode && (
          <div className="hidden md:flex px-6 py-3 border-t border-slate-800 bg-slate-850 items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGuidedPrev}
              disabled={!canGoBack}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Section
            </Button>
            <div className="flex items-center gap-1.5">
              {STANDARD_SECTIONS.map((section, idx) => {
                const sContent = sectionContents[section.id] || '';
                const words = calculateWordCount(sContent);
                const pct = Math.min(100, (words / section.targetWordCount) * 100);
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionSelect(section.id)}
                    title={`${section.title} (${Math.round(pct)}%)`}
                    className={`w-6 h-1.5 rounded-full transition-colors ${
                      idx === activeSectionIndex
                        ? 'bg-blue-500'
                        : pct >= 90
                          ? 'bg-green-500'
                          : pct > 0
                            ? 'bg-amber-500'
                            : 'bg-slate-700'
                    }`}
                  />
                );
              })}
            </div>
            <Button
              variant={canGoForward ? 'default' : 'outline'}
              size="sm"
              onClick={canGoForward ? handleGuidedNext : () => toast.success('All sections complete. Review your proposal.')}
              className="gap-1"
            >
              {canGoForward ? (
                <>
                  Next Section
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Finish
                </>
              )}
            </Button>
          </div>
        )}

        {/* AI Toolbar - Floating on mobile */}
        <div className="md:relative fixed bottom-14 left-0 right-0 md:bottom-auto md:left-auto md:right-auto z-30">
          <AIToolbar
            onAskClaude={handleAskClaude}
            onSuggestImprovements={handleSuggestImprovements}
            onCheckTone={handleCheckTone}
            onFindStatistics={handleFindStatistics}
            suggestion={aiSuggestion}
            isStreaming={isStreaming}
          />
        </div>
      </div>

      {/* Right Panel - Outline - 200px - Hidden on mobile unless active tab */}
      <div className={`w-full md:w-52 shrink-0 border-l border-slate-800 p-4 ${
        mobileTab === 'outline' ? 'block md:block' : 'hidden md:block'
      } md:relative fixed inset-0 z-10 md:z-auto pt-28 md:pt-0 pb-24 md:pb-0 overflow-y-auto`}>
        <OutlinePanel
          activeSection={activeSection}
          onSectionSelect={handleSectionSelect}
          sectionContents={sectionContents}
        />
      </div>
    </div>
  );
}

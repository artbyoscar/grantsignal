export type DocumentType = 'proposal' | 'report' | 'agreement' | 'budget' | 'other';

export interface Source {
  id: string;
  documentId: string;
  documentName: string;
  documentType: DocumentType;
  relevanceScore: number; // 0-100
  excerpt?: string; // Optional snippet from the document
  pageNumber?: number;
}

export interface SourceAttributionPanelProps {
  sources: Source[];
  generatedAt: Date;
  onSourceClick: (source: Source) => void;
  onCopyWithAttribution?: () => void;
  defaultExpanded?: boolean;
}

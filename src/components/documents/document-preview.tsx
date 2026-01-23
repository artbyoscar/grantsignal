'use client';

import { Loader2, AlertCircle, FileText } from 'lucide-react';

interface DocumentPreviewProps {
  document: {
    id: string;
    name: string;
    mimeType: string | null;
    s3Key?: string;
    extractedText?: string | null;
    status: string;
  };
}

export const DocumentPreview = ({ document }: DocumentPreviewProps) => {
  // If still processing
  if (document.status === 'PENDING' || document.status === 'PROCESSING') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-slate-300">Processing document...</h3>
        <p className="text-slate-500 mt-1">This may take a few minutes</p>
      </div>
    );
  }

  // If error
  if (document.status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-slate-300">Processing failed</h3>
        <p className="text-slate-500 mt-1">Unable to process this document</p>
        <button className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
          Retry Processing
        </button>
      </div>
    );
  }

  // If we have extracted content, show it
  if (document.extractedText) {
    return (
      <div className="p-6 prose prose-invert max-w-none">
        <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">
          {document.extractedText}
        </pre>
      </div>
    );
  }

  // If PDF and we have S3 key, try to show PDF viewer
  if (document.mimeType === 'application/pdf' && document.s3Key) {
    return (
      <iframe
        src={`/api/documents/${document.id}/view`}
        className="w-full h-full min-h-[600px]"
        title={document.name}
      />
    );
  }

  // Fallback: Download link
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <FileText className="w-12 h-12 text-slate-600 mb-4" />
      <h3 className="text-lg font-medium text-slate-300">Preview not available</h3>
      <p className="text-slate-500 mt-1 mb-4">Download the file to view it</p>
      <a
        href={`/api/documents/${document.id}/download`}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
      >
        Download File
      </a>
    </div>
  );
};

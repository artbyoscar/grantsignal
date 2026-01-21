import * as React from 'react';

interface DocumentProcessedProps {
  documentName: string;
  documentType: string;
  grantTitle?: string;
  processingStatus: 'COMPLETED' | 'NEEDS_REVIEW' | 'FAILED';
  confidenceScore?: number;
  extractedCommitments?: number;
  warnings?: string[];
  documentUrl: string;
}

export const DocumentProcessedEmail: React.FC<DocumentProcessedProps> = ({
  documentName,
  documentType,
  grantTitle,
  processingStatus,
  confidenceScore,
  extractedCommitments,
  warnings,
  documentUrl,
}) => {
  const statusConfig = {
    COMPLETED: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', emoji: '✅', text: 'Successfully Processed' },
    NEEDS_REVIEW: { color: '#ca8a04', bg: '#fefce8', border: '#fef08a', emoji: '⚠️', text: 'Needs Review' },
    FAILED: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', emoji: '❌', text: 'Processing Failed' },
  };

  const config = statusConfig[processingStatus];

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <div style={{
            backgroundColor: config.bg,
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `2px solid ${config.border}`
          }}>
            <h1 style={{ color: config.color, margin: '0 0 10px 0', fontSize: '24px' }}>
              {config.emoji} Document {config.text}
            </h1>
            <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>
              Your document has been processed
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '15px' }}>
              {documentName}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '5px 0', color: '#64748b' }}>
                <strong>Type:</strong> {documentType}
              </p>
              {grantTitle && (
                <p style={{ margin: '5px 0', color: '#64748b' }}>
                  <strong>Grant:</strong> {grantTitle}
                </p>
              )}
              {confidenceScore !== undefined && (
                <p style={{ margin: '5px 0', color: '#64748b' }}>
                  <strong>Confidence Score:</strong> {confidenceScore}%
                </p>
              )}
            </div>

            {processingStatus === 'COMPLETED' && extractedCommitments !== undefined && (
              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #bbf7d0',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#16a34a' }}>
                  📋 Extracted Commitments
                </div>
                <p style={{ margin: '0', color: '#166534' }}>
                  We found and extracted {extractedCommitments} commitment{extractedCommitments !== 1 ? 's' : ''} from this document.
                </p>
              </div>
            )}

            {warnings && warnings.length > 0 && (
              <div style={{
                backgroundColor: '#fef9c3',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #fde047',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#854d0e' }}>
                  ⚠️ Warnings:
                </div>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#713f12' }}>
                  {warnings.map((warning, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {processingStatus === 'NEEDS_REVIEW' && (
              <div style={{
                backgroundColor: '#fff7ed',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #fed7aa'
              }}>
                <p style={{ margin: '0', color: '#9a3412' }}>
                  This document requires your review. Please verify the extracted information and make any necessary corrections.
                </p>
              </div>
            )}

            {processingStatus === 'FAILED' && (
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <p style={{ margin: '0', color: '#991b1b' }}>
                  We encountered an error processing this document. Please try uploading it again or contact support if the issue persists.
                </p>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <a href={documentUrl} style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#0891b2',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold'
            }}>
              View Document Details
            </a>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            <p>You're receiving this document processing notification from GrantSignal.</p>
            <p>
              <a href="{settingsUrl}" style={{ color: '#0891b2' }}>Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

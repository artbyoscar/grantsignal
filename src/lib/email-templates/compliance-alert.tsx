import * as React from 'react';

interface ComplianceAlertProps {
  alertType: 'CONFLICT_DETECTED' | 'COMMITMENT_DUE';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  affectedGrants: string[];
  actionRequired: string;
  complianceUrl: string;
}

export const ComplianceAlertEmail: React.FC<ComplianceAlertProps> = ({
  alertType,
  severity,
  title,
  description,
  affectedGrants,
  actionRequired,
  complianceUrl,
}) => {
  const severityConfig = {
    CRITICAL: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', emoji: '🚨' },
    HIGH: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', emoji: '⚠️' },
    MEDIUM: { color: '#ca8a04', bg: '#fefce8', border: '#fef08a', emoji: '⚡' },
    LOW: { color: '#0891b2', bg: '#f0f9ff', border: '#bae6fd', emoji: 'ℹ️' },
  };

  const config = severity ? severityConfig[severity] : severityConfig.MEDIUM;

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
              {config.emoji} Compliance Alert
            </h1>
            <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>
              {alertType === 'CONFLICT_DETECTED' ? 'Conflict Detected' : 'Commitment Due Soon'}
              {severity && ` • ${severity} Priority`}
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>
              {title}
            </h2>
            <p style={{ margin: '0 0 20px 0', color: '#475569', lineHeight: '1.8' }}>
              {description}
            </p>

            {affectedGrants.length > 0 && (
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1e293b' }}>
                  Affected Grants:
                </div>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#64748b' }}>
                  {affectedGrants.map((grant, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>{grant}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{
              backgroundColor: '#fef9c3',
              padding: '15px',
              borderRadius: '6px',
              border: '1px solid #fde047'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#854d0e' }}>
                Action Required:
              </div>
              <p style={{ margin: '0', color: '#713f12' }}>
                {actionRequired}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <a href={complianceUrl} style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: config.color,
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold'
            }}>
              Review in Compliance Dashboard
            </a>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            <p>You're receiving this compliance alert from GrantSignal.</p>
            <p>
              <a href="{settingsUrl}" style={{ color: '#0891b2' }}>Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

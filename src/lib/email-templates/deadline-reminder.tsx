import * as React from 'react';

interface DeadlineReminderProps {
  grantTitle: string;
  funderName: string;
  deadline: string;
  daysUntilDeadline: number;
  grantStatus: string;
  grantUrl: string;
}

export const DeadlineReminderEmail: React.FC<DeadlineReminderProps> = ({
  grantTitle,
  funderName,
  deadline,
  daysUntilDeadline,
  grantStatus,
  grantUrl,
}) => {
  const urgencyColor = daysUntilDeadline <= 1 ? '#dc2626' : daysUntilDeadline <= 3 ? '#ea580c' : '#0891b2';

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h1 style={{ color: urgencyColor, margin: '0 0 10px 0', fontSize: '24px' }}>
              📅 Grant Deadline Reminder
            </h1>
            <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>
              {daysUntilDeadline === 0 ? 'Due today!' : `${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''} remaining`}
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>
              {grantTitle}
            </h2>
            <p style={{ margin: '5px 0', color: '#64748b' }}>
              <strong>Funder:</strong> {funderName}
            </p>
            <p style={{ margin: '5px 0', color: '#64748b' }}>
              <strong>Deadline:</strong> {deadline}
            </p>
            <p style={{ margin: '5px 0', color: '#64748b' }}>
              <strong>Status:</strong> <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                fontSize: '12px'
              }}>{grantStatus}</span>
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <a href={grantUrl} style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#0891b2',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold'
            }}>
              View Grant Details
            </a>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            <p>You're receiving this because you have deadline reminders enabled in your GrantSignal notification preferences.</p>
            <p>
              <a href="{settingsUrl}" style={{ color: '#0891b2' }}>Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

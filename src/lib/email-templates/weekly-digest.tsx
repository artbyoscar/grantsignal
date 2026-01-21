import * as React from 'react';

interface GrantSummary {
  id: string;
  title: string;
  funderName: string;
  status: string;
  deadline?: string;
  amount?: number;
}

interface WeeklyDigestProps {
  userName: string;
  weekRange: string;
  stats: {
    totalGrants: number;
    totalAwarded: number;
    activeGrants: number;
    upcomingDeadlines: number;
  };
  upcomingDeadlines: GrantSummary[];
  recentActivity: GrantSummary[];
  dashboardUrl: string;
}

export const WeeklyDigestEmail: React.FC<WeeklyDigestProps> = ({
  userName,
  weekRange,
  stats,
  upcomingDeadlines,
  recentActivity,
  dashboardUrl,
}) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h1 style={{ color: '#0891b2', margin: '0 0 10px 0', fontSize: '28px' }}>
              📊 Weekly Grant Digest
            </h1>
            <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>
              {weekRange}
            </p>
          </div>

          <p style={{ marginBottom: '30px', fontSize: '16px' }}>
            Hi {userName}, here's your weekly grant pipeline summary:
          </p>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0369a1' }}>{stats.totalGrants}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Total Grants</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                ${(stats.totalAwarded / 1000).toFixed(0)}K
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Total Awarded</div>
            </div>
            <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '6px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ca8a04' }}>{stats.activeGrants}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Active Grants</div>
            </div>
            <div style={{ backgroundColor: '#fee2e2', padding: '15px', borderRadius: '6px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{stats.upcomingDeadlines}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Upcoming Deadlines</div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '15px' }}>
                ⏰ Upcoming Deadlines (Next 7 Days)
              </h2>
              {upcomingDeadlines.map((grant) => (
                <div key={grant.id} style={{
                  backgroundColor: '#fff',
                  padding: '15px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' }}>
                    {grant.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {grant.funderName} • Due {grant.deadline}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '15px' }}>
                🎯 Recent Activity
              </h2>
              {recentActivity.map((grant) => (
                <div key={grant.id} style={{
                  backgroundColor: '#fff',
                  padding: '15px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' }}>
                    {grant.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {grant.funderName} • {grant.status}
                    {grant.amount && ` • $${(grant.amount / 1000).toFixed(0)}K`}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <a href={dashboardUrl} style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#0891b2',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold'
            }}>
              View Full Dashboard
            </a>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            <p>You're receiving this weekly digest from GrantSignal.</p>
            <p>
              <a href="{settingsUrl}" style={{ color: '#0891b2' }}>Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, CheckCircle2, AlertTriangle, FileCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsSettingsPage() {
  const utils = api.useUtils();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current preferences
  const { data: preferences, isLoading } = api.notifications.getPreferences.useQuery();

  // Mutation to update preferences
  const updatePreferences = api.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Notification preferences updated');
      utils.notifications.getPreferences.invalidate();
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
      setIsSaving(false);
    },
  });

  // Test notification mutation
  const sendTestNotification = api.notifications.sendTestNotification.useMutation({
    onSuccess: () => {
      toast.success('Test notification sent! Check your email.');
    },
    onError: (error) => {
      toast.error(`Failed to send test: ${error.message}`);
    },
  });

  const handleToggle = async (field: string, value: boolean) => {
    setIsSaving(true);
    updatePreferences.mutate({ [field]: value });
  };

  const handleDigestFrequencyChange = (frequency: 'DAILY' | 'WEEKLY' | 'NONE') => {
    setIsSaving(true);
    updatePreferences.mutate({ digestFrequency: frequency });
  };

  const handleReminderThresholdsChange = (thresholds: number[]) => {
    setIsSaving(true);
    updatePreferences.mutate({ reminderThresholds: thresholds });
  };

  const handleTestNotification = (type: 'DEADLINE_REMINDER' | 'WEEKLY_DIGEST' | 'COMPLIANCE_ALERT' | 'DOCUMENT_PROCESSED') => {
    sendTestNotification.mutate({ type });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center text-gray-500">
          Failed to load notification preferences
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
        <p className="text-gray-600">
          Manage how and when you receive email notifications from GrantSignal
        </p>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList>
          <TabsTrigger value="preferences">
            <Bell className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          {/* Email Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Address
              </CardTitle>
              <CardDescription>
                Notifications will be sent to this email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {preferences.email}
                </Badge>
                <span className="text-xs text-gray-500">
                  (from your account settings)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deadline Reminders */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <Label htmlFor="deadline-reminders" className="text-base font-medium">
                      Deadline Reminders
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get notified before grant deadlines approach
                  </p>
                </div>
                <Switch
                  id="deadline-reminders"
                  checked={preferences.deadlineRemindersEnabled}
                  onCheckedChange={(checked) =>
                    handleToggle('deadlineRemindersEnabled', checked)
                  }
                  disabled={isSaving}
                />
              </div>

              {/* Deadline Thresholds */}
              {preferences.deadlineRemindersEnabled && (
                <div className="ml-6 pl-4 border-l-2 border-gray-200 space-y-2">
                  <Label className="text-sm font-medium">Reminder Schedule</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[7, 3, 1].map((days) => (
                      <button
                        key={days}
                        onClick={() => {
                          const newThresholds = preferences.reminderThresholds.includes(days)
                            ? preferences.reminderThresholds.filter((d) => d !== days)
                            : [...preferences.reminderThresholds, days].sort((a, b) => b - a);
                          handleReminderThresholdsChange(newThresholds);
                        }}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          preferences.reminderThresholds.includes(days)
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={isSaving}
                      >
                        {days} {days === 1 ? 'day' : 'days'} before
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Select when you want to be reminded before deadlines
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification('DEADLINE_REMINDER')}
                    disabled={sendTestNotification.isPending}
                  >
                    Send Test Email
                  </Button>
                </div>
              )}

              {/* Weekly Digest */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <Label htmlFor="weekly-digest" className="text-base font-medium">
                      Grant Pipeline Digest
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Regular summaries of your grant pipeline and upcoming deadlines
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={preferences.weeklyDigestEnabled}
                  onCheckedChange={(checked) =>
                    handleToggle('weeklyDigestEnabled', checked)
                  }
                  disabled={isSaving}
                />
              </div>

              {/* Digest Frequency */}
              {preferences.weeklyDigestEnabled && (
                <div className="ml-6 pl-4 border-l-2 border-gray-200 space-y-2">
                  <Label className="text-sm font-medium">Frequency</Label>
                  <div className="flex gap-2">
                    {(['DAILY', 'WEEKLY', 'NONE'] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => handleDigestFrequencyChange(freq)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          preferences.digestFrequency === freq
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={isSaving}
                      >
                        {freq === 'NONE' ? 'Disabled' : freq.charAt(0) + freq.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {preferences.digestFrequency === 'DAILY' && 'Sent every day at 8 AM'}
                    {preferences.digestFrequency === 'WEEKLY' && 'Sent every Monday at 8 AM'}
                    {preferences.digestFrequency === 'NONE' && 'Digest emails are disabled'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification('WEEKLY_DIGEST')}
                    disabled={sendTestNotification.isPending}
                  >
                    Send Test Email
                  </Button>
                </div>
              )}

              {/* Compliance Alerts */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <Label htmlFor="compliance-alerts" className="text-base font-medium">
                      Compliance Alerts
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get notified when conflicts are detected or commitments are due
                  </p>
                </div>
                <Switch
                  id="compliance-alerts"
                  checked={preferences.complianceAlertsEnabled}
                  onCheckedChange={(checked) =>
                    handleToggle('complianceAlertsEnabled', checked)
                  }
                  disabled={isSaving}
                />
              </div>

              {preferences.complianceAlertsEnabled && (
                <div className="ml-6 pl-4 border-l-2 border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification('COMPLIANCE_ALERT')}
                    disabled={sendTestNotification.isPending}
                  >
                    Send Test Email
                  </Button>
                </div>
              )}

              {/* Document Processed */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-green-500" />
                    <Label htmlFor="document-processed" className="text-base font-medium">
                      Document Processing
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get notified when documents finish processing
                  </p>
                </div>
                <Switch
                  id="document-processed"
                  checked={preferences.documentProcessedEnabled}
                  onCheckedChange={(checked) =>
                    handleToggle('documentProcessedEnabled', checked)
                  }
                  disabled={isSaving}
                />
              </div>

              {preferences.documentProcessedEnabled && (
                <div className="ml-6 pl-4 border-l-2 border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification('DOCUMENT_PROCESSED')}
                    disabled={sendTestNotification.isPending}
                  >
                    Send Test Email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    All notifications are sent via email
                  </p>
                  <p className="text-xs text-blue-700">
                    Make sure to check your spam folder if you don't receive notifications.
                    You can send test emails to verify delivery.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <NotificationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationHistory() {
  const { data, isLoading } = api.notifications.getNotificationLogs.useQuery({
    limit: 20,
    offset: 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No notifications sent yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
        <CardDescription>
          View your notification history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex-shrink-0">
                {log.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{log.subject}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(log.sentAt).toLocaleString()} • {log.type.replace(/_/g, ' ')}
                </p>
                {!log.success && log.errorMessage && (
                  <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                )}
              </div>
              <Badge variant={log.success ? 'default' : 'destructive'} className="flex-shrink-0">
                {log.success ? 'Sent' : 'Failed'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

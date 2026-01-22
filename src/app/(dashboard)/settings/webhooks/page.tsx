'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Webhook, Pause, Play, Trash2, RefreshCw, TestTube } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const WEBHOOK_EVENTS = [
  {
    value: 'grant.status_changed',
    label: 'Grant Status Changed',
    description: 'Triggered when a grant status changes (e.g., DRAFT → SUBMITTED)',
  },
  {
    value: 'document.processed',
    label: 'Document Processed',
    description: 'Triggered when a document finishes processing',
  },
  {
    value: 'compliance.conflict_detected',
    label: 'Compliance Conflict Detected',
    description: 'Triggered when a compliance conflict is detected',
  },
] as const;

export default function WebhooksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    subscribedEvents: [] as string[],
  });

  // Queries
  const { data: webhooks, isLoading } = api.webhooks.list.useQuery();
  const utils = api.useContext();

  // Mutations
  const createMutation = api.webhooks.create.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate();
      setIsCreateOpen(false);
      setFormData({ name: '', url: '', subscribedEvents: [] });
      toast.success('Webhook created', {
        description: 'Your webhook has been created successfully.',
      });
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.message,
      });
    },
  });

  const pauseMutation = api.webhooks.pause.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate();
      toast.success('Webhook paused', {
        description: 'The webhook has been paused.',
      });
    },
  });

  const resumeMutation = api.webhooks.resume.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate();
      toast.success('Webhook resumed', {
        description: 'The webhook has been resumed.',
      });
    },
  });

  const deleteMutation = api.webhooks.delete.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate();
      toast.success('Webhook deleted', {
        description: 'The webhook has been deleted.',
      });
    },
  });

  const regenerateSecretMutation = api.webhooks.regenerateSecret.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate();
      toast.success('Secret regenerated', {
        description: 'The signing secret has been regenerated.',
      });
    },
  });

  const testMutation = api.webhooks.test.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Test successful', {
          description: `Webhook responded with ${data.status} ${data.statusText}`,
        });
      } else {
        toast.error('Test failed', {
          description: data.error || `HTTP ${data.status}`,
        });
      }
    },
  });

  const handleCreate = () => {
    if (!formData.name || !formData.url || formData.subscribedEvents.length === 0) {
      toast.error('Validation error', {
        description: 'Please fill in all required fields.',
      });
      return;
    }

    createMutation.mutate(formData as any);
  };

  const toggleEvent = (eventValue: string) => {
    setFormData((prev) => ({
      ...prev,
      subscribedEvents: prev.subscribedEvents.includes(eventValue)
        ? prev.subscribedEvents.filter((e) => e !== eventValue)
        : [...prev.subscribedEvents, eventValue],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-gray-600 mt-2">
            Configure webhooks to receive real-time notifications about events in your organization
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Add a new webhook endpoint to receive event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My webhook"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  placeholder="https://api.example.com/webhooks"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Events to subscribe</Label>
                <div className="space-y-3">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-start space-x-3">
                      <Checkbox
                        id={event.value}
                        checked={formData.subscribedEvents.includes(event.value)}
                        onCheckedChange={() => toggleEvent(event.value)}
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={event.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {event.label}
                        </label>
                        <p className="text-sm text-gray-500">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      {webhooks && webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first webhook to start receiving event notifications
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks?.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {webhook.name}
                      {webhook.isPaused ? (
                        <Badge variant="secondary">Paused</Badge>
                      ) : webhook.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                      {webhook.failureCount > 0 && (
                        <Badge variant="destructive">{webhook.failureCount} failures</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">{webhook.url}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testMutation.mutate({ id: webhook.id })}
                      disabled={testMutation.isPending}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    {webhook.isPaused ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resumeMutation.mutate({ id: webhook.id })}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseMutation.mutate({ id: webhook.id })}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => regenerateSecretMutation.mutate({ id: webhook.id })}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ id: webhook.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500">Subscribed Events</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {webhook.subscribedEvents.map((event) => (
                        <Badge key={event} variant="outline">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Signing Secret</Label>
                    <code className="block mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
                      {webhook.signingSecret}
                    </code>
                    <p className="text-xs text-gray-500 mt-1">
                      Use this secret to verify webhook signatures (HMAC-SHA256)
                    </p>
                  </div>
                  {webhook.lastFailureAt && (
                    <div className="text-sm text-red-600">
                      Last failure: {new Date(webhook.lastFailureAt).toLocaleString()} -{' '}
                      {webhook.lastFailureReason}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

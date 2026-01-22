export interface StageConfig {
  id: string;
  title: string;
  color: string;
  bgTint: string;
}

export const PIPELINE_STAGES: StageConfig[] = [
  { id: 'PROSPECT', title: 'Prospect', color: '#f59e0b', bgTint: 'bg-amber-500/10' },
  { id: 'RESEARCHING', title: 'Researching', color: '#3b82f6', bgTint: 'bg-blue-500/10' },
  { id: 'WRITING', title: 'Writing', color: '#8b5cf6', bgTint: 'bg-violet-500/10' },
  { id: 'REVIEW', title: 'Review', color: '#f97316', bgTint: 'bg-orange-500/10' },
  { id: 'SUBMITTED', title: 'Submitted', color: '#6366f1', bgTint: 'bg-indigo-500/10' },
  { id: 'PENDING', title: 'Pending', color: '#f97316', bgTint: 'bg-orange-500/10' },
  { id: 'AWARDED', title: 'Awarded', color: '#22c55e', bgTint: 'bg-emerald-500/10' },
  { id: 'DECLINED', title: 'Declined', color: '#64748b', bgTint: 'bg-slate-500/10' },
];

/**
 * Get the full stage configuration by stage ID
 * @param stageId - The stage identifier
 * @returns The stage configuration object
 * @throws Error if stage ID is not found
 */
export function getStageConfig(stageId: string): StageConfig {
  const config = PIPELINE_STAGES.find((stage) => stage.id === stageId);
  if (!config) {
    throw new Error(`Stage configuration not found for ID: ${stageId}`);
  }
  return config;
}

/**
 * Get the hex color for a specific stage
 * @param stageId - The stage identifier
 * @returns The hex color string
 */
export function getStageColor(stageId: string): string {
  return getStageConfig(stageId).color;
}

/**
 * Get the Tailwind background tint class for a specific stage
 * @param stageId - The stage identifier
 * @returns The Tailwind CSS class string
 */
export function getStageBgTint(stageId: string): string {
  return getStageConfig(stageId).bgTint;
}

// Export type alias for convenience
export type PipelineStageId = typeof PIPELINE_STAGES[number]['id'];

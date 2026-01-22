import { cn } from "@/lib/utils";

interface FunderLogoProps {
  name: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Predefined color palette for deterministic color generation
const COLOR_PALETTE = [
  { bg: 'bg-blue-600', text: 'text-white' },
  { bg: 'bg-emerald-600', text: 'text-white' },
  { bg: 'bg-amber-600', text: 'text-white' },
  { bg: 'bg-purple-600', text: 'text-white' },
  { bg: 'bg-rose-600', text: 'text-white' },
  { bg: 'bg-cyan-600', text: 'text-white' },
] as const;

// Simple string hash function for deterministic color selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get color based on name hash
function getColorFromName(name: string) {
  const hash = hashString(name);
  const index = hash % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

// Extract initials from funder name
function getInitials(name: string): string {
  // Remove common articles and prepositions, then split into words
  const words = name
    .replace(/^(The|A|An)\s+/i, '') // Remove leading articles
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();

  // Take first letter of first two words
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

// Size mappings
const SIZE_CLASSES = {
  sm: {
    container: 'w-6 h-6',
    text: 'text-xs',
  },
  md: {
    container: 'w-8 h-8',
    text: 'text-sm',
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-lg',
  },
} as const;

export function FunderLogo({ name, logoUrl, size = 'md' }: FunderLogoProps) {
  const sizeClasses = SIZE_CLASSES[size];

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={cn(
          sizeClasses.container,
          'rounded object-cover'
        )}
      />
    );
  }

  // Fallback to initials with deterministic color
  const initials = getInitials(name);
  const colors = getColorFromName(name);

  return (
    <div
      className={cn(
        sizeClasses.container,
        'rounded-full flex items-center justify-center font-semibold',
        colors.bg,
        colors.text
      )}
      title={name}
    >
      <span className={sizeClasses.text}>{initials}</span>
    </div>
  );
}

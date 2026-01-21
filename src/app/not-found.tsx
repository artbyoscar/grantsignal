"use client";

import Link from "next/link";
import { Search, Home, Target, Database, FileText, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full space-y-12">
        {/* Massive 404 Text with gradient and glow */}
        <div className="relative">
          <h1
            className="text-[200px] md:text-[280px] font-bold text-gradient-blue leading-none select-none"
            style={{
              textShadow: '0 0 100px rgba(59, 130, 246, 0.5), 0 0 200px rgba(59, 130, 246, 0.3)',
            }}
          >
            404
          </h1>
        </div>

        {/* Connected Documents Illustration */}
        <div className="relative w-64 h-32 animate-float">
          <svg
            viewBox="0 0 256 128"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Left document */}
            <rect
              x="20"
              y="30"
              width="70"
              height="90"
              rx="4"
              stroke="url(#grad1)"
              strokeWidth="2"
              fill="rgba(59, 130, 246, 0.05)"
            />
            <line x1="35" y1="50" x2="75" y2="50" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" />
            <line x1="35" y1="65" x2="75" y2="65" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" />
            <line x1="35" y1="80" x2="60" y2="80" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" />

            {/* Right document */}
            <rect
              x="166"
              y="30"
              width="70"
              height="90"
              rx="4"
              stroke="url(#grad2)"
              strokeWidth="2"
              fill="rgba(59, 130, 246, 0.05)"
            />
            <line x1="181" y1="50" x2="221" y2="50" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" />
            <line x1="181" y1="65" x2="221" y2="65" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" />
            <line x1="181" y1="80" x2="206" y2="80" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" />

            {/* Center document (slightly forward) */}
            <rect
              x="93"
              y="15"
              width="70"
              height="90"
              rx="4"
              stroke="url(#grad3)"
              strokeWidth="2"
              fill="rgba(59, 130, 246, 0.1)"
            />
            <line x1="108" y1="35" x2="148" y2="35" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" />
            <line x1="108" y1="50" x2="148" y2="50" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" />
            <line x1="108" y1="65" x2="133" y2="65" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" />

            {/* Connecting lines with glow */}
            <line
              x1="90"
              y1="75"
              x2="55"
              y2="75"
              stroke="url(#grad4)"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-pulse"
            />
            <line
              x1="166"
              y1="75"
              x2="201"
              y2="75"
              stroke="url(#grad5)"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-pulse"
            />

            {/* Connection dots */}
            <circle cx="55" cy="75" r="4" fill="#3b82f6" className="animate-pulse" />
            <circle cx="90" cy="75" r="4" fill="#3b82f6" className="animate-pulse" />
            <circle cx="166" cy="75" r="4" fill="#3b82f6" className="animate-pulse" />
            <circle cx="201" cy="75" r="4" fill="#3b82f6" className="animate-pulse" />

            {/* Gradient definitions */}
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                <stop offset="50%" stopColor="rgba(59, 130, 246, 0.8)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
              </linearGradient>
              <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                <stop offset="50%" stopColor="rgba(59, 130, 246, 0.8)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Content section */}
        <div className="text-center space-y-6 w-full">
          <h2 className="text-4xl font-bold text-white">
            Page not found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Try searching or go back to the dashboard.
          </p>

          {/* Search input */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for grants, documents, or organizations..."
              className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 h-12 focus-visible:ring-blue-500"
            />
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/opportunities"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              <Target className="h-4 w-4" />
              <span>Opportunities</span>
            </Link>
            <Link
              href="/pipeline"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              <Database className="h-4 w-4" />
              <span>Pipeline</span>
            </Link>
            <Link
              href="/documents"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </Link>
            <Link
              href="/help"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help Center</span>
            </Link>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
            >
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="text-slate-400 hover:text-white"
            >
              <Link href="/support">
                Report this issue
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* GrantSignal logo in bottom left */}
      <div className="absolute bottom-8 left-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <div className="w-4 h-4 border-2 border-white rounded-sm" />
          </div>
          <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
            GrantSignal
          </span>
        </Link>
      </div>

      {/* Floating animation keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

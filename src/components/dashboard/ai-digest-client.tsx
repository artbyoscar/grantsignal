"use client";

import { useState } from "react";
import { AIDigest, type AIInsight } from "./ai-digest";
import { api } from "@/lib/trpc/client";

interface AIDigestClientProps {
  initialInsights: AIInsight[];
}

export function AIDigestClient({ initialInsights }: AIDigestClientProps) {
  const [insights, setInsights] = useState(initialInsights);
  const utils = api.useUtils();

  const handleRefresh = async () => {
    try {
      const freshInsights = await utils.dashboard.getAIInsights.fetch();
      setInsights(freshInsights as AIInsight[]);
    } catch (error) {
      console.error("Failed to refresh insights:", error);
    }
  };

  return <AIDigest insights={insights} onRefresh={handleRefresh} />;
}

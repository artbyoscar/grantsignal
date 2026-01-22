"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface FundingDonutProps {
  data: { name: string; value: number; color: string }[];
  total: number;
}

export function FundingDonutChart({ data, total }: FundingDonutProps) {
  // Calculate percentages for legend
  const dataWithPercentages = data.map((item) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1),
  }));

  // Custom legend component
  const renderLegend = () => {
    return (
      <div className="flex flex-col gap-2 justify-center">
        {dataWithPercentages.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">
              {entry.name} ({entry.percentage}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding by Program Area</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-8">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  dataKey="value"
                  label={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-shrink-0">{renderLegend()}</div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface YoYComparisonProps {
  data: { quarter: string; lastYear: number; currentYear: number }[];
}

export function YoYComparison({ data }: YoYComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>YoY Comparison (Awards)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 60]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              label={{ value: "Count", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                backgroundColor: "white",
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="rect"
              formatter={(value) => {
                if (value === "lastYear") return "Last Year";
                if (value === "currentYear") return "Current Year";
                return value;
              }}
            />
            <Bar
              dataKey="lastYear"
              fill="#9ca3af"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="currentYear"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

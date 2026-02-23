"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Loader2, TrendingUp, Target, BarChart as BarChartIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/analytics")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-[#003087]" size={48} />
      </div>
    );
  }

  const COLORS = ["#003087", "#00AEEF", "#F26522", "#00A651", "#ED1C24"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Performance Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Over Time */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="text-blue-600" size={20} />
              <span>Score Trend (Last 10 Tests)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="testName" 
                  tick={{ fontSize: 12 }} 
                  interval={0}
                  tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + "..." : value}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#003087"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject-wise Accuracy */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="text-green-600" size={20} />
              <span>Subject-wise Accuracy (%)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subjectData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                  {data.subjectData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.subjectData.map((subject: any, idx: number) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{subject.subject}</p>
                  <p className="text-2xl font-bold mt-1">{subject.accuracy}%</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <BarChartIcon className="text-gray-400" size={20} />
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    width: `${subject.accuracy}%`,
                    backgroundColor: COLORS[idx % COLORS.length]
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{subject.total} Questions attempted</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

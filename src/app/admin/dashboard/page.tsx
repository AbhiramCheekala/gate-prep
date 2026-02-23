"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText, Users, GraduationCap, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
      });
  }, []);

  if (!stats) return <div>Loading stats...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Questions" value={stats.totalQuestions} icon={<FileText className="text-blue-600" />} />
        <StatCard title="Total Tests" value={stats.totalTests} icon={<CheckCircle className="text-green-600" />} />
        <StatCard title="Registered Students" value={stats.totalStudents} icon={<Users className="text-purple-600" />} />
        <StatCard title="Total Attempts" value={stats.totalAttempts} icon={<GraduationCap className="text-orange-600" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Question Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.breakdown).map(([type, count]: [string, any]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="font-medium">{type}</span>
                  <div className="w-64 bg-gray-100 rounded-full h-2.5 ml-4 flex-1">
                    <div className="bg-[#003087] h-2.5 rounded-full" style={{ width: `${(count / stats.totalQuestions) * 100}%` }}></div>
                  </div>
                  <span className="ml-4 font-bold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: any, icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 uppercase">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch("/api/student/history")
      .then(res => res.json())
      .then(data => {
        if (data.success) setHistory(data.data);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#003087]">Attempt History</h2>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Test Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Score</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{item.testName}</div>
                    <div className="text-xs text-gray-500">{item.testType.toUpperCase()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(item.startedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {item.totalScore} / {item.maxScore}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={item.status === 'submitted' ? 'success' : 'warning'}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/student/test/some-id/result?attemptId=${item.id}`}>
                      <Button variant="outline" size="sm">View Result</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <div className="p-8 text-center text-gray-500">No attempts yet.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

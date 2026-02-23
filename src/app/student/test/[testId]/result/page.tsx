"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function TestResultPage() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) setData(resData.data);
      });
  }, [attemptId]);

  if (!data) return <div className="p-8">Loading result...</div>;

  const correctCount = data.responses.filter((r: any) => r.isCorrect).length;
  const incorrectCount = data.responses.filter((r: any) => r.isCorrect === false).length;
  const unattemptedCount = (data.responses.length) - correctCount - incorrectCount;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#003087]">Test Summary</h1>
        <p className="text-gray-500">Attempt ID: {attemptId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-8 bg-[#003087] text-white">
          <div className="text-sm uppercase tracking-widest opacity-80 mb-2">Final Score</div>
          <div className="text-6xl font-bold">{data.totalScore}</div>
          <div className="mt-2 opacity-80">out of {data.maxScore}</div>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{correctCount}</div>
              <div className="text-xs uppercase text-green-600 font-bold">Correct</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{incorrectCount}</div>
              <div className="text-xs uppercase text-red-600 font-bold">Incorrect</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">{unattemptedCount}</div>
              <div className="text-xs uppercase text-gray-600 font-bold">Unattempted</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Link href="/student/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
        <Button onClick={() => window.print()}>Download Scorecard</Button>
      </div>
    </div>
  );
}

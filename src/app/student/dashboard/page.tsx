"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const [tests, setTests] = useState([]);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/tests")
      .then(res => res.json())
      .then(data => {
        if (data.success) setTests(data.data);
      });
  }, []);

  const startTest = async (testId: string) => {
    setStartingTestId(testId);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        body: JSON.stringify({ testId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/student/test/${testId}?attemptId=${data.data.attemptId}`);
      }
    } finally {
      setStartingTestId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Tests Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Attempted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Best Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-[#003087]">Available Tests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test: any) => (
          <Card key={test.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{test.name}</CardTitle>
                <Badge variant={test.type === 'mock' ? 'danger' : 'success'}>
                  {test.type.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                Duration: {test.durationMins} mins
              </div>
              <Button 
                className="w-full" 
                onClick={() => startTest(test.id)}
                loading={startingTestId === test.id}
              >
                Start Test
              </Button>
            </CardContent>
          </Card>
        ))}
        {tests.length === 0 && <div className="text-gray-500">No active tests available.</div>}
      </div>
    </div>
  );
}

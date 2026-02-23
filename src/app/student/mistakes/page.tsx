"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loader2, AlertCircle } from "lucide-react";

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/mistakes")
      .then((res) => res.json())
      .then((data) => {
        setMistakes(data);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Mistakes</h2>
        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
          {mistakes.length} Questions to Review
        </Badge>
      </div>

      {mistakes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No mistakes found. Great job!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {mistakes.map((mistake, idx) => (
            <Card key={mistake.id} className="overflow-hidden border-l-4 border-l-red-500">
              <CardHeader className="bg-gray-50 flex flex-row items-center justify-between py-3">
                <span className="text-sm font-semibold text-gray-500">
                  Question {idx + 1} ({mistake.questionType})
                </span>
                <Badge>{mistake.question?.marks} Marks</Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="prose max-w-none">
                  <p className="font-medium">{mistake.question?.question}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-red-50 rounded-md border border-red-100">
                    <span className="font-bold text-red-700 block mb-1">Your Answer:</span>
                    <span className="text-red-600">
                      {mistake.questionType === "MCQ" && mistake.mcqResponse}
                      {mistake.questionType === "NAT" && mistake.natResponse}
                      {mistake.questionType === "MSQ" && JSON.stringify(mistake.msqResponse)}
                    </span>
                  </div>
                  <div className="p-3 bg-green-50 rounded-md border border-green-100">
                    <span className="font-bold text-green-700 block mb-1">Correct Answer:</span>
                    <span className="text-green-600">
                      {mistake.questionType === "MCQ" && mistake.question?.correctAns}
                      {mistake.questionType === "NAT" && `${mistake.question?.correctAnsMin} - ${mistake.question?.correctAnsMax}`}
                      {mistake.questionType === "MSQ" && JSON.stringify(mistake.question?.correctAnswers)}
                    </span>
                  </div>
                </div>

                {mistake.question?.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
                    <span className="font-bold text-blue-700 block mb-1">Explanation:</span>
                    <p className="text-blue-800 text-sm">{mistake.question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

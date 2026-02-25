"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loader2, AlertCircle } from "lucide-react";

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchMistakes = useCallback(async (cursor?: string) => {
    const isInitial = !cursor;
    if (isInitial) setLoading(true);
    else setIsFetchingMore(true);

    try {
      const url = cursor ? `/api/student/mistakes?cursor=${cursor}` : "/api/student/mistakes";
      const res = await fetch(url);
      const data = await res.json();
      
      setMistakes((prev) => isInitial ? data.items : [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Failed to fetch mistakes:", error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-[#003087]" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Mistakes</h2>
        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
          Review Your Incorrect Responses
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
        <>
          <div className="grid gap-6">
            {mistakes.map((mistake, idx) => (
              <Card key={`${mistake.id}-${idx}`} className="overflow-hidden border-l-4 border-l-red-500">
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
                        {mistake.questionType === "MCQ" && (
                          <span>
                            {(() => {
                              const labels: Record<string, string> = { option1: "A", option2: "B", option3: "C", option4: "D" };
                              const label = labels[mistake.mcqResponse] || mistake.mcqResponse;
                              return `(${label}) ${mistake.question?.[mistake.mcqResponse] || ""}`;
                            })()}
                          </span>
                        )}
                        {mistake.questionType === "NAT" && (mistake.natResponse || "Unattempted")}
                        {mistake.questionType === "MSQ" && (
                          <div className="space-y-1">
                            {!mistake.msqResponse || (Array.isArray(mistake.msqResponse) && mistake.msqResponse.length === 0) ? "Unattempted" : (
                              Array.isArray(mistake.msqResponse) && mistake.msqResponse.map((opt: string) => {
                                const labels: Record<string, string> = { option1: "A", option2: "B", option3: "C", option4: "D" };
                                const label = labels[opt] || opt;
                                return <div key={opt}>({label}) {mistake.question?.[opt]}</div>;
                              })
                            )}
                          </div>
                        )}
                      </span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-md border border-green-100">
                      <span className="font-bold text-green-700 block mb-1">Correct Answer:</span>
                      <span className="text-green-600">
                        {mistake.questionType === "MCQ" && (
                          <span>
                            {(() => {
                              const labels: Record<string, string> = { option1: "A", option2: "B", option3: "C", option4: "D" };
                              const label = labels[mistake.question?.correctAns] || mistake.question?.correctAns;
                              return `(${label}) ${mistake.question?.[mistake.question?.correctAns] || ""}`;
                            })()}
                          </span>
                        )}
                        {mistake.questionType === "NAT" && `${mistake.question?.correctAnsMin} - ${mistake.question?.correctAnsMax}`}
                        {mistake.questionType === "MSQ" && (
                          <div className="space-y-1">
                            {Array.isArray(mistake.question?.correctAnswers) && mistake.question.correctAnswers.map((opt: string) => {
                              const labels: Record<string, string> = { option1: "A", option2: "B", option3: "C", option4: "D" };
                              const label = labels[opt] || opt;
                              return <div key={opt}>({label}) {mistake.question?.[opt]}</div>;
                            })}
                          </div>
                        )}
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

          {nextCursor && (
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={() => fetchMistakes(nextCursor)} 
                disabled={isFetchingMore}
                className="min-w-[150px]"
              >
                {isFetchingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

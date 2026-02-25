"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QuestionPanel } from "@/components/student/QuestionPanel";
import { QuestionPalette } from "@/components/student/QuestionPalette";
import { TimerBar } from "@/components/student/TimerBar";
import { Button } from "@/components/ui/Button";

export default function TestTakingPage({ params }: { params: { testId: string } }) {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const router = useRouter();
  const testContainerRef = useRef<HTMLDivElement>(null);

  const [test, setTest] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const requestFullScreen = () => {
    if (testContainerRef.current) {
      if (testContainerRef.current.requestFullscreen) {
        testContainerRef.current.requestFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  const fetchTestData = useCallback(async () => {
    const res = await fetch(`/api/tests/${params.testId}`);
    const data = await res.json();
    if (data.success) {
      setTest(data.data);
      
      const attRes = await fetch(`/api/attempts/${attemptId}`);
      const attData = await attRes.json();
      if (attData.success) {
        setResponses(attData.data.responses);
        const currentRes = attData.data.responses.find((r: any) => r.testQuestionId === data.data.questions[0].testQuestionId);
        if (currentRes) {
          if (data.data.questions[0].type === 'MCQ') setCurrentResponse(currentRes.mcqResponse);
          else if (data.data.questions[0].type === 'NAT') setCurrentResponse(currentRes.natResponse);
          else if (data.data.questions[0].type === 'MSQ') setCurrentResponse(currentRes.msqResponse);
        }
      }
    }
    setLoading(false);
  }, [params.testId, attemptId]);

  useEffect(() => {
    fetchTestData();
  }, [fetchTestData]);

  const saveResponse = async (isMarked: boolean = false) => {
    const question = test.questions[currentIdx];
    setSubmitting(true);
    await fetch(`/api/attempts/${attemptId}/respond`, {
      method: "POST",
      body: JSON.stringify({
        testQuestionId: question.testQuestionId,
        questionType: question.type,
        response: currentResponse,
        timeSpentSecs: 0, // Placeholder
        isMarkedForReview: isMarked,
      }),
    });
    
    // Refresh responses
    const attRes = await fetch(`/api/attempts/${attemptId}`);
    const attData = await attRes.json();
    if (attData.success) setResponses(attData.data.responses);

    if (currentIdx < test.questions.length - 1) {
      goToQuestion(currentIdx + 1);
    }
    setSubmitting(false);
  };

  const goToQuestion = (idx: number) => {
    setCurrentIdx(idx);
    const question = test.questions[idx];
    const res = responses.find((r: any) => r.testQuestionId === question.testQuestionId);
    if (res) {
      if (question.type === 'MCQ') setCurrentResponse(res.mcqResponse);
      else if (question.type === 'NAT') setCurrentResponse(res.natResponse);
      else if (question.type === 'MSQ') setCurrentResponse(res.msqResponse);
    } else {
      setCurrentResponse(null);
    }
  };

  const submitTest = async () => {
    if (!confirm("Are you sure you want to submit the test?")) return;
    setSubmitting(true);
    const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      router.push(`/student/test/${params.testId}/result?attemptId=${attemptId}`);
    } else {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading test...</div>;
  if (!test) return <div className="p-8">Test not found.</div>;

  return (
    <div ref={testContainerRef} className="flex flex-col h-screen bg-gray-100 w-full relative">
      {!isFullScreen && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-[200] p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-2xl">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Start?</h2>
            <p className="text-gray-600 mb-8">
              To ensure a fair testing environment, this exam must be taken in full-screen mode.
            </p>
            <Button onClick={requestFullScreen} size="lg" className="w-full">
              Enter Full Screen & Start Test
            </Button>
          </div>
        </div>
      )}

      <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
        <div className="font-bold text-[#003087]">GATE Online Test Series - {test.name}</div>
        <TimerBar durationMins={test.durationMins || 180} onTimeUp={() => {}} />
        <Button variant="danger" size="sm" onClick={submitTest} loading={submitting}>Submit Test</Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col bg-white border-r overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <QuestionPanel 
              question={test.questions[currentIdx]} 
              response={currentResponse} 
              onResponseChange={setCurrentResponse} 
            />
          </div>
          <div className="h-16 border-t bg-gray-50 flex items-center justify-between px-6 shrink-0">
            <div className="space-x-2">
              <Button variant="purple" onClick={() => saveResponse(true)} loading={submitting}>Mark for Review & Next</Button>
              <Button variant="secondary" onClick={() => setCurrentResponse(null)} disabled={submitting}>Clear Response</Button>
            </div>
            <Button onClick={() => saveResponse(false)} loading={submitting}>Save & Next</Button>
          </div>
        </div>

        {/* Right Panel */}
        <aside className="w-80 flex flex-col bg-gray-50 shrink-0 overflow-y-auto">
          <div className="p-4 bg-gray-200 flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded" />
            <div className="text-xs">
              <div className="font-bold uppercase">Candidate Name</div>
              <div className="text-[#003087]">GATE-2026-STU-001</div>
            </div>
          </div>
          <QuestionPalette 
            questions={test.questions} 
            currentIdx={currentIdx} 
            responses={responses} 
            onSelect={goToQuestion} 
          />
        </aside>
      </div>
    </div>
  );
}

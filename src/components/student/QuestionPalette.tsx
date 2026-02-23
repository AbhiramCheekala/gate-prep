"use client";

import { cn } from "@/lib/utils";

interface QuestionPaletteProps {
  questions: any[];
  currentIdx: number;
  responses: any[];
  onSelect: (idx: number) => void;
}

export function QuestionPalette({ questions, currentIdx, responses, onSelect }: QuestionPaletteProps) {
  return (
    <div className="p-4 border bg-white rounded-md">
      <h3 className="text-sm font-bold mb-4 uppercase text-[#003087]">Question Palette</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const res = responses.find(r => r.testQuestionId === q.testQuestionId);
          let status = "unvisited";
          if (res) {
            if (res.isMarkedForReview && (res.mcqResponse || res.natResponse || res.msqResponse)) status = "answered-marked";
            else if (res.isMarkedForReview) status = "marked";
            else if (res.mcqResponse || res.natResponse || res.msqResponse) status = "answered";
            else status = "visited";
          }

          const colors = {
            unvisited: "bg-white border-gray-300",
            visited: "bg-red-500 text-white",
            answered: "bg-green-600 text-white rounded-br-2xl",
            marked: "bg-purple-600 text-white rounded-full",
            "answered-marked": "bg-purple-600 text-white rounded-full border-4 border-green-500",
          };

          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={cn(
                "w-10 h-10 flex items-center justify-center text-xs font-bold border transition-all",
                (colors as any)[status],
                currentIdx === idx ? "ring-2 ring-orange-500 ring-offset-2" : ""
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 space-y-2 text-[10px] uppercase font-bold text-gray-500">
        <div className="flex items-center"><div className="w-4 h-4 bg-green-600 rounded-br-lg mr-2" /> Answered</div>
        <div className="flex items-center"><div className="w-4 h-4 bg-red-500 mr-2" /> Not Answered</div>
        <div className="flex items-center"><div className="w-4 h-4 bg-white border border-gray-300 mr-2" /> Not Visited</div>
        <div className="flex items-center"><div className="w-4 h-4 bg-purple-600 rounded-full mr-2" /> Marked for Review</div>
        <div className="flex items-center"><div className="w-4 h-4 bg-purple-600 rounded-full border-2 border-green-500 mr-2" /> Answered & Marked</div>
      </div>
    </div>
  );
}

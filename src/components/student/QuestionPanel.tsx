"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface QuestionPanelProps {
  question: any;
  response: any;
  onResponseChange: (val: any) => void;
}

export function QuestionPanel({ question, response, onResponseChange }: QuestionPanelProps) {
  if (!question) return <div>Loading question...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-3 border-b">
        <div className="flex gap-4 items-center">
          <span className="font-bold">Type: {question.type}</span>
          {question.negativeMarks && Number(question.negativeMarks) !== 0 && (
            <span className="text-red-600 text-sm font-semibold">
              Negative Marks: {question.negativeMarks}
            </span>
          )}
          {(!question.negativeMarks || Number(question.negativeMarks) === 0) && (
            <span className="text-green-600 text-sm font-semibold">
              No Negative Marks
            </span>
          )}
        </div>
        <span className="bg-[#003087] text-white px-3 py-1 rounded text-sm">{question.marks} Mark(s)</span>
      </div>
      
      <div className="text-lg font-medium text-gray-800 px-4 whitespace-pre-wrap">
        {question.question}
      </div>

      {question.code && (
        <div className="px-4">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto font-mono text-sm leading-relaxed">
            <code>{question.code}</code>
          </pre>
        </div>
      )}

      <div className="px-4 space-y-3">
        {question.type === 'MCQ' && (
          <div className="grid grid-cols-1 gap-3">
            {['option1', 'option2', 'option3', 'option4'].map((opt) => (
              <button
                key={opt}
                className={`flex items-center p-4 border rounded-md text-left transition-all ${
                  response === opt ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" : "hover:bg-gray-50"
                }`}
                onClick={() => onResponseChange(opt)}
              >
                <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                  response === opt ? "border-blue-500 bg-blue-500" : "border-gray-300"
                }`}>
                  {response === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span>{question[opt]}</span>
              </button>
            ))}
          </div>
        )}

        {question.type === 'MSQ' && (
          <div className="grid grid-cols-1 gap-3">
            {['option1', 'option2', 'option3', 'option4'].map((opt) => {
              const isSelected = (response || []).includes(opt);
              return (
                <button
                  key={opt}
                  className={`flex items-center p-4 border rounded-md text-left transition-all ${
                    isSelected ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    const current = response || [];
                    if (isSelected) onResponseChange(current.filter((i: string) => i !== opt));
                    else onResponseChange([...current, opt]);
                  }}
                >
                  <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                    isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-white" style={{ width: 8, height: 2 }} />}
                  </div>
                  <span>{question[opt]}</span>
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'NAT' && (
          <div className="max-w-xs space-y-4">
            <Input
              type="number"
              placeholder="Enter your answer"
              value={response || ""}
              onChange={(e) => onResponseChange(e.target.value)}
              className="text-lg h-12"
            />
            <div className="grid grid-cols-3 gap-2 bg-gray-100 p-2 rounded">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '←'].map((btn) => (
                <Button
                  key={btn.toString()}
                  variant="outline"
                  size="lg"
                  className="bg-white"
                  onClick={() => {
                    if (btn === '←') onResponseChange(response?.toString().slice(0, -1));
                    else onResponseChange((response || "").toString() + btn.toString());
                  }}
                >
                  {btn}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

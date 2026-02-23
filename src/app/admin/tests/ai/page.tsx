"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, ArrowLeft, Sparkles, CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AIGeneratorPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [aiConfig, setAiConfig] = useState({
    apiKey: "",
    subjectId: "",
    count: 5,
    prompt: "Hard level, focus on core concepts and gate previous year patterns",
    type: "mixed",
    model: "gemini-1.5-flash"
  });

  const [testInfo, setTestInfo] = useState({
    name: "",
    type: "practice",
    durationMins: "60"
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/subjects")
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        setLoading(false);
      });
  }, []);

  const handleGenerate = async () => {
    if (!aiConfig.apiKey || !aiConfig.subjectId) {
      alert("Please provide Gemini API Key and select a Subject.");
      return;
    }

    const subject = subjects.find(s => s.id === aiConfig.subjectId);
    setGenerating(true);
    
    try {
      const res = await fetch("/api/admin/tests/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: aiConfig.apiKey,
          subjectName: subject.name,
          count: aiConfig.count,
          customPrompt: aiConfig.prompt,
          type: aiConfig.type,
          model: aiConfig.model
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedQuestions(data);
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTest = async () => {
    if (!testInfo.name || generatedQuestions.length === 0) {
      alert("Please enter a test name and ensure questions are generated.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testInfo,
          selectionMode: "ai",
          subjectId: aiConfig.subjectId,
          generatedQuestions: generatedQuestions
        })
      });

      if (res.ok) {
        alert("AI Test created successfully!");
        router.push("/admin/tests");
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error: any) {
      alert("Error saving: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = (idx: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/admin/tests"><Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button></Link>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Sparkles className="mr-2 text-purple-600" />
            AI Test Generator (Gemini Powered)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config */}
        <Card className="lg:col-span-1 h-fit sticky top-6">
          <CardHeader><CardTitle>AI Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Gemini API Key</label>
              <Input 
                type="password" 
                placeholder="Paste your key here" 
                value={aiConfig.apiKey}
                onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Gemini Model</label>
              <select
                className="w-full h-10 px-3 py-2 bg-white border rounded-md"
                value={aiConfig.model}
                onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Latest)</option>
                <option value="gemini-pro">Gemini 1.0 Pro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Subject</label>
              <select
                className="w-full h-10 px-3 py-2 bg-white border rounded-md"
                value={aiConfig.subjectId}
                onChange={(e) => setAiConfig({...aiConfig, subjectId: e.target.value})}
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Question Count</label>
              <Input 
                type="number" 
                value={aiConfig.count}
                onChange={(e) => setAiConfig({...aiConfig, count: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">AI Prompt / Rules</label>
              <textarea 
                className="w-full p-2 border rounded-md text-sm"
                rows={4}
                value={aiConfig.prompt}
                onChange={(e) => setAiConfig({...aiConfig, prompt: e.target.value})}
              />
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" size={16} />}
              Generate Questions
            </Button>
          </CardContent>
        </Card>

        {/* Right: Review & Save */}
        <div className="lg:col-span-2 space-y-6">
          {generatedQuestions.length > 0 && (
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader><CardTitle>Step 2: Review & Finalize Test</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    placeholder="Test Name" 
                    value={testInfo.name}
                    onChange={(e) => setTestInfo({...testInfo, name: e.target.value})}
                  />
                  <Input 
                    type="number" 
                    placeholder="Duration (Mins)" 
                    value={testInfo.durationMins}
                    onChange={(e) => setTestInfo({...testInfo, durationMins: e.target.value})}
                  />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSaveTest} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" /> : <CheckCircle className="mr-2" />}
                  Create Test with {generatedQuestions.length} Questions
                </Button>
              </CardContent>
            </Card>
          )}

          {generatedQuestions.map((q, idx) => (
            <Card key={idx} className="relative group">
              <button 
                onClick={() => removeQuestion(idx)}
                className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded">{q.type}</span>
                  <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700">{q.marks} Marks</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium text-gray-800">{q.question}</p>
                {q.type === 'MCQ' || q.type === 'MSQ' ? (
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className={q.correctAns === 'option1' || q.correctAnswers?.includes('option1') ? 'text-green-600 font-bold' : ''}>1: {q.option1}</div>
                    <div className={q.correctAns === 'option2' || q.correctAnswers?.includes('option2') ? 'text-green-600 font-bold' : ''}>2: {q.option2}</div>
                    <div className={q.correctAns === 'option3' || q.correctAnswers?.includes('option3') ? 'text-green-600 font-bold' : ''}>3: {q.option3}</div>
                    <div className={q.correctAns === 'option4' || q.correctAnswers?.includes('option4') ? 'text-green-600 font-bold' : ''}>4: {q.option4}</div>
                  </div>
                ) : (
                  <div className="text-sm text-green-600 font-bold">Answer Range: {q.correctAnsMin} - {q.correctAnsMax}</div>
                )}
                {q.explanation && <p className="text-xs text-gray-400 italic">Exp: {q.explanation}</p>}
              </CardContent>
            </Card>
          ))}

          {generatedQuestions.length === 0 && !generating && (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-gray-400">
              <Sparkles size={48} className="mb-4 opacity-20" />
              <p>Questions will appear here after generation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

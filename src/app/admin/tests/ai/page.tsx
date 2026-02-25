"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, ArrowLeft, Sparkles, CheckCircle, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AIGeneratorPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [aiConfig, setAiConfig] = useState({
    apiKey: "",
    subjectId: "",
    count: 5,
    prompt: "Hard level, focus on core concepts and gate previous year patterns",
    type: "mixed",
    model: "gemini-1.5-flash-latest" // Recommended default for Free Tier
  });

  const [testInfo, setTestInfo] = useState({
    name: "",
    type: "practice",
    durationMins: "60"
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load subjects for the dropdown
    fetch("/api/admin/subjects")
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load subjects", err);
        setLoading(false);
      });
  }, []);

  const handleGenerate = async () => {
    setError(null);
    if (!aiConfig.apiKey || !aiConfig.subjectId) {
      setError("Please provide Gemini API Key and select a Subject.");
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
        // AI returns an array of questions now
        setGeneratedQuestions(prev => [...prev, ...data]);
      } else {
        setError(data.error || "Generation failed. Please check your API key.");
      }
    } catch (err: any) {
      setError("Connection Error: " + (err.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTest = async () => {
    setError(null);
    if (!testInfo.name || generatedQuestions.length === 0) {
      setError("Please enter a test name and ensure questions are generated.");
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
        router.push("/admin/tests");
      } else {
        const err = await res.json();
        setError(err.error);
      }
    } catch (err: any) {
      setError("Error saving test: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = (idx: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="animate-spin text-purple-600" size={48} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 lg:p-0">
      <div className="flex items-center space-x-4">
        <Link href="/admin/tests">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Sparkles className="mr-2 text-purple-600" />
              AI Test Generator
          </h2>
          <p className="text-sm text-gray-500">Generate high-quality GATE practice questions instantly</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center shadow-sm">
          <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1 h-fit sticky top-6 shadow-md border-purple-100">
          <CardHeader className="bg-purple-50/50 border-b">
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="mr-2 text-purple-500" size={18} />
              AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 flex justify-between">
                Gemini API Key 
                <Link href="https://aistudio.google.com/app/apikey" target="_blank" className="text-purple-600 normal-case font-normal hover:underline text-[10px]">Get Key</Link>
              </label>
              <Input 
                type="password" 
                placeholder="Paste your key here" 
                value={aiConfig.apiKey}
                className="focus:ring-purple-500 focus:border-purple-500"
                onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Gemini Model (Free Tier)</label>
              <select
                className="w-full h-10 px-3 py-2 bg-white border rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                value={aiConfig.model}
                onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
              >
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Recommended)</option>
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (More Detailed)</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Fastest)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Subject</label>
              <select
                className="w-full h-10 px-3 py-2 bg-white border rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                value={aiConfig.subjectId}
                onChange={(e) => setAiConfig({...aiConfig, subjectId: e.target.value})}
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Questions to Generate</label>
              <Input 
                type="number" 
                value={aiConfig.count}
                min={1}
                max={20}
                className="focus:ring-purple-500"
                onChange={(e) => setAiConfig({...aiConfig, count: Math.min(20, Math.max(1, parseInt(e.target.value) || 1))})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Rules & Level</label>
              <textarea 
                className="w-full p-3 border rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                rows={3}
                placeholder="Ex: Hard, focus on data structures, include Python code snippets..."
                value={aiConfig.prompt}
                onChange={(e) => setAiConfig({...aiConfig, prompt: e.target.value})}
              />
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-11 transition-all" 
              onClick={handleGenerate} 
              disabled={generating}
            >
              {generating ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Generating...</>
              ) : (
                <><Sparkles className="mr-2" size={16} /> Generate Questions</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-6">
          {generatedQuestions.length > 0 && (
            <Card className="border-green-200 bg-green-50/50 shadow-sm border-2">
              <CardHeader className="pb-3"><CardTitle className="text-lg">Review & Finalize Test</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 px-1">Test Name</label>
                    <Input 
                      placeholder="Ex: DSA Practice - Set 1" 
                      value={testInfo.name}
                      className="bg-white"
                      onChange={(e) => setTestInfo({...testInfo, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 px-1">Duration (Mins)</label>
                    <Input 
                      type="number" 
                      placeholder="Duration" 
                      value={testInfo.durationMins}
                      className="bg-white"
                      onChange={(e) => setTestInfo({...testInfo, durationMins: e.target.value})}
                    />
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 h-11" onClick={handleSaveTest} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" size={18} />}
                  Create Test with {generatedQuestions.length} Questions
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {generatedQuestions.map((q, idx) => (
              <Card key={idx} className="relative group hover:border-purple-200 transition-colors shadow-sm">
                <button 
                  onClick={() => removeQuestion(idx)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <Trash2 size={16} />
                </button>
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 uppercase">{q.type}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{q.marks} MARKS</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="font-medium text-gray-800 text-sm leading-relaxed">{q.question}</p>
                  
                  {q.type === 'MCQ' || q.type === 'MSQ' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['option1', 'option2', 'option3', 'option4'].map((optKey) => {
                        const isCorrect = q.type === 'MCQ' 
                          ? q.correctAns === optKey 
                          : (q.correctAnswers || []).includes(optKey);
                        
                        return (
                          <div 
                            key={optKey} 
                            className={`p-3 rounded-lg border text-xs flex items-center ${
                              isCorrect 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-gray-50 border-gray-100 text-gray-600'
                            }`}
                          >
                            <span className="font-bold mr-2 opacity-50 uppercase">{optKey.replace('option', '')}.</span>
                            {q[optKey]}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 p-3 rounded-lg flex items-center justify-between">
                      <span className="text-xs font-bold text-green-700">Correct Answer Range:</span>
                      <span className="font-mono text-sm bg-white px-3 py-1 rounded border text-green-800">
                        {q.correctAnsMin} - {q.correctAnsMax}
                      </span>
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-2 p-3 bg-blue-50/50 rounded-lg text-xs text-blue-800 border border-blue-100">
                      <span className="font-bold block mb-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {generatedQuestions.length === 0 && !generating && (
            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-gray-50/50 text-gray-400">
              <Sparkles size={64} className="mb-4 opacity-10" />
              <p className="text-sm font-medium">No questions generated yet</p>
              <p className="text-xs opacity-60">Configure settings and click generate to start</p>
            </div>
          )}

          {generating && (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

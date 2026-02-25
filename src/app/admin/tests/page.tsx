"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Plus, FileText, Clock, CheckCircle, Search, Sparkles } from "lucide-react";
import Link from "next/link";

export default function TestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "practice",
    durationMins: "60",
    selectionMode: "manual", // 'manual' or 'random'
    selectedQuestions: [] as { id: string, type: string }[],
    randomCounts: {
      mcq: 0,
      msq: 0,
      nat: 0
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    Promise.all([fetchTests(), fetchQuestions()]).then(() => setLoading(false));
  }, []);

  const fetchTests = async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    const url = `/api/admin/tests?limit=10${cursor ? `&cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (cursor) {
      setTests(prev => [...prev, ...data.items]);
    } else {
      setTests(data.items);
    }
    setNextCursor(data.nextCursor);
    setLoadingMore(false);
  };

  const fetchQuestions = async () => {
    const res = await fetch("/api/admin/questions?limit=1000"); // Fetch a large number for selection
    const data = await res.json();
    setQuestions(data.items || []);
  };

  const toggleQuestionSelection = (id: string, type: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedQuestions.some(q => q.id === id);
      if (isSelected) {
        return { ...prev, selectedQuestions: prev.selectedQuestions.filter(q => q.id !== id) };
      } else {
        return { ...prev, selectedQuestions: [...prev.selectedQuestions, { id, type }] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Please enter a name.");
      return;
    }

    if (formData.selectionMode === "manual" && formData.selectedQuestions.length === 0) {
      alert("Please select at least one question.");
      return;
    }

    if (formData.selectionMode === "random") {
      const total = Object.values(formData.randomCounts).reduce((a, b) => a + b, 0);
      if (total === 0) {
        alert("Please specify at least one question count.");
        return;
      }
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        type: formData.type,
        durationMins: formData.durationMins,
        selectionMode: formData.selectionMode,
        questionIds: formData.selectionMode === "manual" ? formData.selectedQuestions : undefined,
        randomCounts: formData.selectionMode === "random" ? formData.randomCounts : undefined
      }),
    });

    if (res.ok) {
      setFormData({ 
        name: "", 
        type: "practice", 
        durationMins: "60", 
        selectionMode: "manual",
        selectedQuestions: [],
        randomCounts: { mcq: 0, msq: 0, nat: 0 }
      });
      setShowAddForm(false);
      fetchTests();
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setSubmitting(false);
  };

  const filteredQuestions = Array.isArray(questions) ? questions.filter(q => 
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-gray-800" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Test Management</h2>
        <div className="flex gap-4">
          <Link href="/admin/tests/ai">
            <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
              <Sparkles size={16} className="mr-2" />
              Generate with AI
            </Button>
          </Link>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : (
              <>
                <Plus size={16} className="mr-2" />
                Create New Test
              </>
            )}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>Create New Test</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Name</label>
                  <Input
                    placeholder="e.g., Mock Test 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="practice">Practice</option>
                    <option value="mock">Mock</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (Mins)</label>
                  <Input
                    type="number"
                    value={formData.durationMins}
                    onChange={(e) => setFormData({ ...formData, durationMins: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-6">
                  <label className="text-sm font-semibold">Selection Mode:</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="selectionMode" 
                        value="manual"
                        checked={formData.selectionMode === "manual"}
                        onChange={() => setFormData({...formData, selectionMode: "manual"})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Manual Selection</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="selectionMode" 
                        value="random"
                        checked={formData.selectionMode === "random"}
                        onChange={() => setFormData({...formData, selectionMode: "random"})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Random Assignment</span>
                    </label>
                  </div>
                </div>

                {formData.selectionMode === "random" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">MCQ Questions</label>
                      <Input 
                        type="number" 
                        min="0"
                        value={formData.randomCounts.mcq}
                        onChange={(e) => setFormData({
                          ...formData, 
                          randomCounts: {...formData.randomCounts, mcq: parseInt(e.target.value) || 0}
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">MSQ Questions</label>
                      <Input 
                        type="number" 
                        min="0"
                        value={formData.randomCounts.msq}
                        onChange={(e) => setFormData({
                          ...formData, 
                          randomCounts: {...formData.randomCounts, msq: parseInt(e.target.value) || 0}
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">NAT Questions</label>
                      <Input 
                        type="number" 
                        min="0"
                        value={formData.randomCounts.nat}
                        onChange={(e) => setFormData({
                          ...formData, 
                          randomCounts: {...formData.randomCounts, nat: parseInt(e.target.value) || 0}
                        })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold">Select Questions ({formData.selectedQuestions.length} selected)</label>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          placeholder="Search questions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 h-9"
                        />
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto border rounded-md divide-y">
                      {filteredQuestions.map((q) => (
                        <div 
                          key={q.id} 
                          className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${formData.selectedQuestions.some(sq => sq.id === q.id) ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleQuestionSelection(q.id, q.type)}
                        >
                          <div className={`mt-1 h-5 w-5 rounded border flex items-center justify-center ${formData.selectedQuestions.some(sq => sq.id === q.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                            {formData.selectedQuestions.some(sq => sq.id === q.id) && <CheckCircle size={14} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 uppercase">{q.type}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{q.marks} Marks</span>
                            </div>
                            <p className="text-sm text-gray-800 line-clamp-2">{q.question}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={submitting} size="lg">
                  {!submitting && <CheckCircle size={20} className="mr-2" />}
                  Finalize and Create Test
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{test.name}</CardTitle>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${test.type === 'mock' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {test.type}
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock size={16} className="mr-2" />
                  <span>{test.durationMins} Minutes</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <FileText size={16} className="mr-2" />
                  <span>Test ID: {test.id.substring(0, 8)}...</span>
                </div>
                <div className="pt-2 border-t flex justify-between items-center">
                  <span className={`text-xs font-medium ${test.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {test.isActive ? '● Active' : '○ Inactive'}
                  </span>
                  <span className="text-[10px] text-gray-400">Created {new Date(test.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {nextCursor && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => fetchTests(nextCursor)} 
            loading={loadingMore}
            size="lg"
          >
            Load More Tests
          </Button>
        </div>
      )}
    </div>
  );
}

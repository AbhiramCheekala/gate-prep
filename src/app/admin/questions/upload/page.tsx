"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BulkUploadPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/subjects")
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      alert("Please select a subject.");
      return;
    }

    try {
      const questions = JSON.parse(jsonInput);
      if (!Array.isArray(questions)) throw new Error("Input must be an array of questions.");

      setSubmitting(true);
      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: selectedSubject, questions }),
      });

      if (res.ok) {
        alert("Bulk upload successful!");
        router.push("/admin/questions");
      } else {
        const err = await res.json();
        alert(err.error || "Upload failed.");
      }
    } catch (error: any) {
      alert("Invalid JSON format: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-gray-800" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/admin/questions">
          <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">Bulk Upload Questions</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Subject & Paste JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <select
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                required
              >
                <option value="">-- Select a Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">JSON Questions Array</label>
              <textarea
                className="w-full h-96 p-4 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='[
  {
    "type": "MCQ",
    "question": "What is 2+2?",
    "option1": "3",
    "option2": "4",
    "option3": "5",
    "option4": "6",
    "correctAns": "option2",
    "marks": 1
  }
]'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Send size={20} className="mr-2" />}
                Upload Questions
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

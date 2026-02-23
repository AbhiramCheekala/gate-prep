"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Plus, Book } from "lucide-react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const res = await fetch("/api/admin/subjects");
    const data = await res.json();
    setSubjects(data);
    setLoading(false);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubject }),
    });

    if (res.ok) {
      setNewSubject("");
      fetchSubjects();
    }
    setSubmitting(false);
  };

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
        <h2 className="text-2xl font-bold text-gray-800">Manage Subjects</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubject} className="flex gap-4">
            <Input
              placeholder="Subject Name (e.g., Operating Systems)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
              Add Subject
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Book className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{subject.name}</h3>
                  <p className="text-sm text-gray-500">
                    Added: {new Date(subject.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Upload, Plus, Loader2 } from "lucide-react";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);

    const url = `/api/admin/questions?limit=20${cursor ? `&cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (cursor) {
      setQuestions(prev => [...prev, ...data.items]);
    } else {
      setQuestions(data.items);
    }
    
    setNextCursor(data.nextCursor);
    setLoading(false);
    setLoadingMore(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Question Bank</h2>
        <div className="space-x-3">
          <Link href="/admin/questions/upload">
            <Button variant="outline"><Upload className="w-4 h-4 mr-2" /> Bulk Upload</Button>
          </Link>
          <Button><Plus className="w-4 h-4 mr-2" /> Add Question</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin text-gray-800" size={32} />
            </div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Question</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Type</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Marks</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {questions.map((q: any) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium line-clamp-1">{q.question}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={q.type === 'MCQ' ? 'default' : q.type === 'NAT' ? 'warning' : 'purple'}>
                          {q.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">{q.marks}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {questions.length === 0 && <div className="p-8 text-center text-gray-500">No questions found.</div>}
              
              {nextCursor && (
                <div className="p-4 border-t flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchQuestions(nextCursor)} 
                    loading={loadingMore}
                  >
                    Load More Questions
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

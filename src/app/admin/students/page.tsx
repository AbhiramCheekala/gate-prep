"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Plus, Users, Mail, UserPlus } from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);

    const url = `/api/admin/students?limit=10${cursor ? `&cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (cursor) {
      setStudents(prev => [...prev, ...data.items]);
    } else {
      setStudents(data.items);
    }
    
    setNextCursor(data.nextCursor);
    setLoading(false);
    setLoadingMore(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;

    setSubmitting(true);
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setFormData({ name: "", email: "", password: "" });
      fetchStudents();
    } else {
      const err = await res.json();
      alert(err.error);
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
        <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus size={20} />
            <span>Register New Student</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
              Register
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 font-semibold text-gray-600">Name</th>
                  <th className="pb-3 font-semibold text-gray-600">Email</th>
                  <th className="pb-3 font-semibold text-gray-600">Status</th>
                  <th className="pb-3 font-semibold text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b last:border-0">
                    <td className="py-3 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {student.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{student.name}</span>
                    </td>
                    <td className="py-3 text-gray-600">{student.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-sm">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="text-center py-8 text-gray-500">No students registered yet.</div>
            )}
          </div>
          {nextCursor && (
            <div className="mt-6 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => fetchStudents(nextCursor)} 
                disabled={loadingMore}
              >
                {loadingMore ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Load More Students
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

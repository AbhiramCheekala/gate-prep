"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function LoginPage() {
  const [role, setRole] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.role === "student") router.push("/student/dashboard");
        else router.push("/admin/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: any) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-[#003087] mb-2">GATE Prep</div>
          <CardTitle>Welcome Back</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex mb-6 rounded-md bg-gray-100 p-1">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded ${role === "student" ? "bg-white shadow" : "text-gray-500"}`}
              onClick={() => setRole("student")}
            >
              Student
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded ${role === "admin" ? "bg-white shadow" : "text-gray-500"}`}
              onClick={() => setRole("admin")}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Button className="w-full" type="submit" loading={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          {role === "student" && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button onClick={() => router.push("/register")} className="text-orange-500 hover:underline">
                Register
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

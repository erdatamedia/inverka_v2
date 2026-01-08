"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      saveToken(data.access_token);
      router.push(`/dashboard/${data.role}`);
    } catch {
      alert("Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <img
            src="/logo inverka.jpeg"
            alt="Inverka Logo"
            className="mx-auto mb-2 w-20 h-20 object-contain"
          />
          <CardTitle>Login Inverka</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? "..." : "Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

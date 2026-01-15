"use client";

import * as React from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios"; // Tambahkan import ini jika Anda menggunakan Axios!
import { ArrowLeft } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Tetap gunakan Input untuk email
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input"; // <--- KOMPONEN BARU

import { setAuth, api } from "@/lib/api";

// ... (Skema dan Tipe tetap sama)
const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Minimal 6 karakter"),
});
type FormValues = z.infer<typeof schema>;
// ...

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  // Hapus state showPassword karena sudah diurus oleh komponen PasswordInput
  // const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  type LoginResp = {
    access_token: string;
    role: "superadmin" | "petugas" | "verifikator" | "viewer";
    email: string;
    province?: string | null;
  };

  const onSubmit = async (values: FormValues) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.post<LoginResp>("/auth/login", values);

      // set token ke cookie + header default Authorization
      setAuth(res.data.access_token);

      // persist role & identity for client-side guards/menus
      Cookies.set("role", res.data.role, { path: "/" });
      Cookies.set("email", res.data.email, { path: "/" });
      if (res.data.province) {
        Cookies.set("province", res.data.province, { path: "/" });
      }

      // arahkan sesuai role
      const target =
        res.data.role === "superadmin"
          ? "/dashboard/superadmin"
          : res.data.role === "verifikator"
          ? "/dashboard/verifikator"
          : res.data.role === "petugas"
          ? "/dashboard/petugas"
          : "/dashboard/viewer";

      router.replace(target);
    } catch (err) {
      // PENANGANAN ERROR LEBIH RAPI DENGAN isAxiosError
      let msg = "Login gagal. Periksa koneksi atau kredensial Anda.";

      if (isAxiosError(err) && err.response) {
        const status = err.response.status;
        const apiMessage = (err.response.data as { message?: string })?.message;

        if (apiMessage) {
          // Tampilkan pesan API jika ada
          msg = apiMessage;
        } else {
          // Tampilkan status error umum
          msg = `Error ${status}: Terjadi kesalahan pada server.`;
        }
      } else if (err instanceof Error) {
        msg = err.message; // Error non-Axios lainnya
      }

      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 animate-gradient bg-[length:400%_400%]">
      {/* Decorative animated background blobs - JANGAN LUPA DEFINISIKAN ANIMASI gradient DI global.css */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      ></div>
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-4">
          <div className="flex w-full justify-start">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft />
              Kembali
            </Button>
          </div>
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="mb-1">
              <Image
                src="/logo-inverka.png"
                alt="INVERKA"
                width={2000}
                height={2000}
                priority
                className="rounded-md shadow-sm object-contain"
              />
            </div>
            <CardTitle className="text-2xl">Masuk ke INVERKA</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              {/* GUNAKAN KOMPONEN BARU DI SINI */}
              <PasswordInput
                id="password"
                placeholder="••••••••"
                {...register("password")}
              />

              {/* Tombol Tampil/Sembunyi Dihapus */}
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Masuk..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

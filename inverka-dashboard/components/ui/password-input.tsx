"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react"; // Asumsi menggunakan lucide-react
import { cn } from "@/lib/utils"; // Asumsi Anda punya utilitas cn
import { Button } from "@/components/ui/button"; // Tombol dari UI Anda
import { Input } from "@/components/ui/input"; // Komponen Input asli

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)} // Tambahkan padding di kanan untuk ikon
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-label="Sembunyikan password" />
          ) : (
            <Eye className="h-4 w-4" aria-label="Tampilkan password" />
          )}
        </Button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };

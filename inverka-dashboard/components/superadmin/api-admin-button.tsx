"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export function ApiAdminButton() {
  const links = [
    { label: "Population", href: `${API_BASE}/config/population` },
    { label: "Animal Params", href: `${API_BASE}/config/animal-params` },
    { label: "Manure Mgmt", href: `${API_BASE}/config/manure-mgmt` },
    { label: "Manure N Excretion", href: `${API_BASE}/config/manure-nex` },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Buka API Admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {links.map((l) => (
          <DropdownMenuItem key={l.href} asChild>
            <a href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

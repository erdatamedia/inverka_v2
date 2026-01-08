"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { User } from "@/lib/user-api";

const PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Jawa Timur",
  "Jawa Barat",
  "Bali",
];

const EMPTY_MODEL: Omit<User, "id"> = {
  name: "",
  email: "",
  province: PROVINCES[0],
  provinceCode: null,
  role: "petugas",
  active: true,
};

export default function UserEditDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: User;
  onSubmit: (u: Omit<User, "id"> | User) => Promise<void>;
}) {
  const { open, onOpenChange, initial, onSubmit } = props;
  const [model, setModel] = useState<Omit<User, "id">>(EMPTY_MODEL);

  useEffect(() => {
    if (open) setModel(initial ?? EMPTY_MODEL);
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Petugas" : "Tambah Petugas"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Nama</Label>
            <Input
              value={model.name}
              onChange={(e) => setModel({ ...model, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={model.email}
              onChange={(e) => setModel({ ...model, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Provinsi</Label>
            <select
              className="border rounded p-2 w-full"
              value={model.province}
              onChange={(e) => setModel({ ...model, province: e.target.value })}
            >
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Role</Label>
            <select
              className="border rounded p-2 w-full"
              value={model.role}
              onChange={(e) =>
                setModel({ ...model, role: e.target.value as User["role"] })
              }
            >
              <option value="petugas">Petugas</option>
              <option value="superadmin">Superadmin</option>
              <option value="verifikator">Verifikator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => onSubmit(model)}>
            {initial ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

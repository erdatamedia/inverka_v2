"use client";

import { FormEvent, Fragment, useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MitigationAction, MitigationFeed } from "@/lib/types";
import { usePetugas } from "@/store/usePetugas";

export function MitigationForm() {
  const {
    input,
    mitigationOptions,
    mitigationFeeds,
    mitigationCategories,
    mitigationLoading,
    mitigationError,
    mitigationData,
    loadMitigationData,
    addMitigation,
    removeMitigation,
    setMitigationFeed,
    setMitigationAction,
    setMitigationPopulation,
    prev,
    submit,
    loading,
    error,
  } = usePetugas((state) => ({
    input: state.input,
    mitigationOptions: state.mitigationOptions,
    mitigationFeeds: state.mitigationFeeds,
    mitigationCategories: state.mitigationCategories,
    mitigationLoading: state.mitigationLoading,
    mitigationError: state.mitigationError,
    mitigationData: state.mitigationData,
    loadMitigationData: state.loadMitigationData,
    addMitigation: state.addMitigation,
    removeMitigation: state.removeMitigation,
    setMitigationFeed: state.setMitigationFeed,
    setMitigationAction: state.setMitigationAction,
    setMitigationPopulation: state.setMitigationPopulation,
    prev: state.prev,
    submit: state.submit,
    loading: state.loading,
    error: state.error,
  }));

  useEffect(() => {
    if (!mitigationLoading && mitigationOptions.length === 0) {
      void loadMitigationData();
    }
  }, [loadMitigationData, mitigationLoading, mitigationOptions.length]);

  const feedOptions = useMemo(() => {
    const labels = new Map(
      mitigationOptions.map((option) => [option.feedKey, option.feedLabel])
    );
    return mitigationFeeds.map((feed) => ({
      value: feed,
      label: labels.get(feed) ?? feed,
    }));
  }, [mitigationFeeds, mitigationOptions]);

  const categories = mitigationCategories.length
    ? mitigationCategories
    : Object.keys(
        input.mitigations[0]?.populations ?? { "Pre weaning": 0, Young: 0 }
      );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submit();
  };

  const showEmptyNotice =
    !mitigationLoading && mitigationOptions.length === 0 && !mitigationError;
  const hasCustomMitigation = mitigationData.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {mitigationLoading ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Memuat daftar aksi mitigasi…
          </div>
        ) : null}

        {mitigationError ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <span>{mitigationError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => {
                void loadMitigationData();
              }}
            >
              Coba lagi
            </Button>
          </div>
        ) : null}

        {showEmptyNotice ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Belum ada data master mitigasi. Tambahkan nilai faktor koreksi pada
            menu superadmin &gt; Mitigation untuk mengaktifkan perhitungan.
          </div>
        ) : null}

        {!hasCustomMitigation && mitigationOptions.length > 0 ? (
          <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
            Menggunakan aksi mitigasi bawaan. Perbarui data pada menu superadmin
            &gt; Mitigation untuk menyesuaikan faktor koreksi.
          </div>
        ) : null}

        {input.mitigations.length === 0 && (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Tidak ada aksi mitigasi. Tambahkan minimal satu aksi agar perhitungan
            memberi dampak.
          </div>
        )}

        {input.mitigations.map((mitigation, index) => {
          const actionsForFeed = mitigationOptions.filter(
            (option) => option.feedKey === mitigation.feed
          );
          const selectedOption = mitigation.feed
            ? mitigationOptions.find(
                (option) =>
                  option.feedKey === mitigation.feed &&
                  option.action === mitigation.action
              )
            : undefined;

          return (
            <Fragment key={`${index}-${mitigation.feed}-${mitigation.action}`}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-start">
                <div className="space-y-2">
                  <Label>Pakan Utama</Label>
                  <Select
                    value={mitigation.feed}
                    onValueChange={(value) =>
                      setMitigationFeed(index, value as MitigationFeed)
                    }
                    disabled={mitigationLoading || feedOptions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pakan" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedOptions.map((feed) => (
                        <SelectItem key={feed.value} value={feed.value}>
                          {feed.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Aksi Mitigasi</Label>
                  <Select
                    value={mitigation.action}
                    onValueChange={(value) =>
                      setMitigationAction(index, value as MitigationAction)
                    }
                    disabled={
                      mitigationLoading ||
                      !mitigation.feed ||
                      actionsForFeed.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih aksi" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionsForFeed.map((action) => (
                        <SelectItem
                          key={`${action.feedKey}-${action.action}`}
                          value={action.action}
                        >
                          {action.actionLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                <div className="mb-3 text-sm font-medium text-foreground">
                  Populasi Ternak & Faktor Koreksi
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {categories.map((category) => {
                    const factor =
                      selectedOption?.factors?.[category] ?? null;
                    return (
                      <div
                        key={category}
                        className="rounded-md border border-border/60 bg-background p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Faktor koreksi:{" "}
                            {factor != null ? factor.toFixed(3) : "-"}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Populasi (ekor)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={mitigation.populations[category] ?? 0}
                            onChange={(event) =>
                              setMitigationPopulation(
                                index,
                                category,
                                Number.isFinite(Number(event.target.value))
                                  ? Number(event.target.value)
                                  : 0
                              )
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeMitigation(index)}
                  disabled={loading}
                >
                  Hapus
                </Button>
              </div>
            </Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={prev}
            disabled={loading}
          >
            Kembali
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={addMitigation}
            disabled={
              loading || mitigationLoading || mitigationOptions.length === 0
            }
          >
            Tambah Mitigasi
          </Button>
        </div>
        <Button type="submit" disabled={loading || mitigationLoading}>
          {loading ? "Menghitung..." : "Hitung Emisi"}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}

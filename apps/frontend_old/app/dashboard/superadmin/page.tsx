"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/role-guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PopulationRow = {
  Production_System: string;
  Animal_Category: string;
  Population_Head: number;
};

type AnimalParamRow = {
  Production_System: string;
  Animal_Category: string;
  LW: number;
  Mature_Weight_kg: number;
  ADG: number;
  Milk_kg_day: number;
  DMD_percent: number;
  CP_percent_diet: number;
  Ash_percent_diet: number;
  Fat_Content_Milk_percent: number;
  Work_Hours_day: number;
  Prop_Cows_Pregnant_percent: number;
  Ym_input: number;
};

type ManureRow = {
  Production_System: string;
  Animal_Category: string;
  Lagoon: number;
  "Liquid/Slurry": number;
  Solid_Storage: number;
  Dry_Lot: number;
  "Pasture/Range/Paddock": number;
  Daily_Spread: number;
  Composting: number;
  Burned_for_fuel: number;
  Biogas: number;
};

export default function SuperadminPage() {
  const [pop, setPop] = useState<PopulationRow[]>([]);
  const [params, setParams] = useState<AnimalParamRow[]>([]);
  const [manure, setManure] = useState<ManureRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/config/population"),
      api.get("/config/animal-params"),
      api.get("/config/manure-mgmt"),
    ])
      .then(([p, a, m]) => {
        setPop(p.data);
        setParams(a.data);
        setManure(m.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleGuard allow={["superadmin"]}>
      <AppShell role="superadmin">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Data Master (Read-only)</h2>
          <Button asChild>
            <a href="http://localhost:8000" target="_blank" rel="noreferrer">
              Buka API Admin
            </a>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Population</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              "Loading..."
            ) : (
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 border">System</th>
                    <th className="p-2 border">Category</th>
                    <th className="p-2 border text-right">Population (Head)</th>
                  </tr>
                </thead>
                <tbody>
                  {pop.map((r, i) => (
                    <tr key={i}>
                      <td className="border p-2">{r.Production_System}</td>
                      <td className="border p-2">{r.Animal_Category}</td>
                      <td className="border p-2 text-right">
                        {r.Population_Head?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Animal Parameters</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              "Loading..."
            ) : (
              <table className="w-full text-xs border">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 border">System</th>
                    <th className="p-2 border">Category</th>
                    <th className="p-2 border">LW</th>
                    <th className="p-2 border">Mature Wt</th>
                    <th className="p-2 border">ADG</th>
                    <th className="p-2 border">Milk</th>
                    <th className="p-2 border">DMD%</th>
                    <th className="p-2 border">CP%</th>
                    <th className="p-2 border">Ash%</th>
                    <th className="p-2 border">Fat% Milk</th>
                    <th className="p-2 border">Work h/d</th>
                    <th className="p-2 border">Pregnant%</th>
                    <th className="p-2 border">Ym</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((r, i) => (
                    <tr key={i}>
                      <td className="border p-2">{r.Production_System}</td>
                      <td className="border p-2">{r.Animal_Category}</td>
                      <td className="border p-2">{r.LW}</td>
                      <td className="border p-2">{r.Mature_Weight_kg}</td>
                      <td className="border p-2">{r.ADG}</td>
                      <td className="border p-2">{r.Milk_kg_day}</td>
                      <td className="border p-2">{r.DMD_percent}</td>
                      <td className="border p-2">{r.CP_percent_diet}</td>
                      <td className="border p-2">{r.Ash_percent_diet}</td>
                      <td className="border p-2">
                        {r.Fat_Content_Milk_percent}
                      </td>
                      <td className="border p-2">{r.Work_Hours_day}</td>
                      <td className="border p-2">
                        {r.Prop_Cows_Pregnant_percent}
                      </td>
                      <td className="border p-2">{r.Ym_input}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manure Management System Distribution (%)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              "Loading..."
            ) : (
              <table className="w-full text-xs border">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 border">System</th>
                    <th className="p-2 border">Category</th>
                    {[
                      "Lagoon",
                      "Liquid/Slurry",
                      "Solid_Storage",
                      "Dry_Lot",
                      "Pasture/Range/Paddock",
                      "Daily_Spread",
                      "Composting",
                      "Burned_for_fuel",
                      "Biogas",
                    ].map((h) => (
                      <th className="p-2 border" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {manure.map((r, i) => (
                    <tr key={i}>
                      <td className="border p-2">{r.Production_System}</td>
                      <td className="border p-2">{r.Animal_Category}</td>
                      <td className="border p-2">{r["Lagoon"]}</td>
                      <td className="border p-2">{r["Liquid/Slurry"]}</td>
                      <td className="border p-2">{r["Solid_Storage"]}</td>
                      <td className="border p-2">{r["Dry_Lot"]}</td>
                      <td className="border p-2">
                        {r["Pasture/Range/Paddock"]}
                      </td>
                      <td className="border p-2">{r["Daily_Spread"]}</td>
                      <td className="border p-2">{r["Composting"]}</td>
                      <td className="border p-2">{r["Burned_for_fuel"]}</td>
                      <td className="border p-2">{r["Biogas"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </AppShell>
    </RoleGuard>
  );
}

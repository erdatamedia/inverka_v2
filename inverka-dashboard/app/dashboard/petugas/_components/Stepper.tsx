"use client";

import { clsx } from "clsx";

import { usePetugas, type Step } from "@/store/usePetugas";

const labels: Record<Step, string> = {
  1: "Populasi",
  2: "Mitigasi",
  3: "Hasil",
};

export function Stepper() {
  const { step, setStep, result } = usePetugas((state) => ({
    step: state.step,
    setStep: state.setStep,
    result: state.result,
  }));

  const handleClick = (target: Step) => {
    if (target <= step) setStep(target);
  };

  const steps: Step[] = [1, 2, 3];

  return (
    <nav className="flex items-center justify-center gap-4 md:gap-8">
      {steps.map((stepId) => {
        const disabled = stepId === 3 && !result;
        return (
          <button
            type="button"
            key={stepId}
            disabled={disabled}
            onClick={() => {
              if (!disabled) handleClick(stepId);
            }}
            className={clsx(
              "flex items-center gap-2 text-sm font-medium transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
              stepId === step
                ? "text-primary"
                : stepId < step
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            <span
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-full border",
                stepId === step
                  ? "border-primary bg-primary/10 text-primary"
                  : stepId < step
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-muted"
              )}
            >
              {stepId}
            </span>
            {labels[stepId]}
          </button>
        );
      })}
    </nav>
  );
}

import React from "react";
import Link from "next/link";
import type { ActivationStatus } from "@/domain/activation/service";

type OnboardingFlowProps = {
  hasProperty: boolean;
  hasRoom: boolean;
  activation: ActivationStatus;
};

export function OnboardingFlow({
  hasProperty,
  hasRoom,
  activation
}: OnboardingFlowProps) {
  const steps = [
    { label: "Detalii proprietate", done: hasProperty, href: "/app/property" },
    { label: "Prima camera", done: hasRoom, href: "/app/rooms" },
    { label: "Verificare activare", done: activation.ready, href: "/app" }
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-clay">Configurare</p>
        <h1 className="text-2xl font-bold">Porneste cu baza corecta</h1>
      </div>

      <section className="space-y-3">
        {steps.map((step, index) => (
          <Link className="panel block" href={step.href} key={step.label}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-ink/60">Pasul {index + 1}</p>
                <h2 className="font-semibold">{step.label}</h2>
              </div>
              <span className="rounded-md bg-mist px-3 py-1 text-sm font-semibold">
                {step.done ? "Gata" : "Lipseste"}
              </span>
            </div>
          </Link>
        ))}
      </section>

      {!activation.ready ? (
        <section className="panel">
          <h2 className="font-semibold">Cerinte ramase</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/75">
            {activation.missingRequirements.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

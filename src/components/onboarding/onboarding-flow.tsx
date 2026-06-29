import React from "react";
import Link from "next/link";
import type { ActivationStatus } from "@/domain/activation/service";

type OnboardingFlowProps = {
  hasPropertyDetails: boolean;
  hasRoom: boolean;
  activation: ActivationStatus;
};

export function OnboardingFlow({
  hasPropertyDetails,
  hasRoom,
  activation
}: OnboardingFlowProps) {
  const steps = [
    {
      label: "Detalii proprietate",
      helper: "Nume, localitate, contact, ore si reguli.",
      done: hasPropertyDetails,
      href: "/app/property"
    },
    {
      label: "Prima camera",
      helper: "Camera activa cu capacitate si pret pe noapte.",
      done: hasRoom,
      href: "/app/rooms"
    },
    {
      label: "Verificare activare",
      helper: "Setarile pilot raman sigure pentru modul in asteptare.",
      done: activation.ready,
      href: "/app"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-clay">Configurare</p>
        <h1 className="text-2xl font-bold">Porneste cu baza corecta</h1>
        <p className="mt-1 text-sm text-ink/65">
          Trei pasi simpli ca proprietatea sa fie pregatita pentru pilot.
        </p>
      </div>

      <section className="space-y-3">
        {steps.map((step, index) => (
          <Link className="panel block" href={step.href} key={step.label}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-ink/60">Pasul {index + 1}</p>
                <h2 className="font-semibold">{step.label}</h2>
                <p className="mt-1 text-sm text-ink/65">{step.helper}</p>
              </div>
              <span
                className={
                  step.done
                    ? "w-fit rounded-md bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800"
                    : "w-fit rounded-md bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900"
                }
              >
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

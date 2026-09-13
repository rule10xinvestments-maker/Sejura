"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SejuraLogo } from "@/components/brand/sejura-logo";
import { propertyScopedHref } from "@/domain/properties/navigation";
import { signOut } from "@/lib/auth/actions";

const nav = [
  { href: "/app/property", label: "Proprietate" },
  { href: "/app/rooms", label: "Camere" },
  { href: "/app/bookings", label: "Rezervări" },
  { href: "/app/calendar", label: "Calendar" },
  { href: "/app/settings", label: "Setări" }
];

export function AppShell({
  children,
  notificationCounts
}: {
  children: React.ReactNode;
  notificationCounts?: { unread: number; critical: number };
}) {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const logoHref = propertyScopedHref("/app/property", propertyId);

  return (
    <div className="min-h-[100svh] bg-mist">
      <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href={logoHref}>
            <SejuraLogo size="sm" />
          </Link>
          <form action={signOut}>
            <button className="button-secondary min-h-10 px-3 py-1" type="submit">
              Iesi
            </button>
          </form>
        </div>
        {notificationCounts && notificationCounts.unread > 0 ? (
          <div className="mx-auto max-w-5xl px-4 pb-2 text-sm">
            <Link
              className="inline-flex w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-900 sm:w-auto"
              href="/app/notifications"
            >
              {notificationCounts.critical > 0
                ? `${notificationCounts.critical} notificari critice`
                : `${notificationCounts.unread} notificari necitite`}
            </Link>
          </div>
        ) : null}
        <nav
          aria-label="Navigare proprietar"
          className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-3"
        >
          {nav.map((item) => (
            <Link
              className="min-h-10 whitespace-nowrap rounded-md border border-line bg-white px-3 py-2 text-sm font-medium"
              href={propertyScopedHref(item.href, propertyId)}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-4 sm:py-5">{children}</main>
    </div>
  );
}

import { SejuraLogo } from "@/components/brand/sejura-logo";

export default function AppLoading() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#1f3328] px-6 text-white">
      <section className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 shadow-soft ring-1 ring-white/15">
          <SejuraLogo showText={false} size="lg" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
          Sejura
        </p>
        <h1 className="mt-2 text-2xl font-bold">Forest is loading...</h1>
        <div className="mt-6 flex items-end justify-center gap-2">
          <span className="h-0 w-0 border-x-[10px] border-b-[18px] border-x-transparent border-b-white/35" />
          <span className="h-0 w-0 translate-y-2 border-x-[12px] border-b-[24px] border-x-transparent border-b-white/45" />
          <span className="h-0 w-0 border-x-[10px] border-b-[18px] border-x-transparent border-b-white/35" />
        </div>
      </section>
    </main>
  );
}

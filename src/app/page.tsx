// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert h-5 w-[100px]"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the{" "}
//             <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
//               page.tsx
//             </code>{" "}
//             file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert h-[14px] w-4"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={14}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }


import Link from "next/link";
import { ArrowRight, Activity, BellRing, ClipboardList, Landmark } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getT } from "@/i18n/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {Navbar} from "../components/Navbar"

export const dynamic = "force-dynamic";

async function loadOfficeName(lang: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("settings")
      .select("office_name_en, office_name_hi")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return null;
    return lang === "hi" ? data.office_name_hi : data.office_name_en;
  } catch {
    return null;
  }
}

export default async function Home() {
  const { t, lang } = await getT();
  const officeName = await loadOfficeName(lang);

  const features = [
    { icon: ClipboardList, title: t("home.f1Title"), text: t("home.f1Text") },
    { icon: Activity, title: t("home.f2Title"), text: t("home.f2Text") },
    { icon: BellRing, title: t("home.f3Title"), text: t("home.f3Text") },
  ];

  return (
       <main className="min-h-dvh bg-gradient-to-b from-secondary to-background">
      <Navbar showHelp />
      <div className="mx-auto flex max-w-5xl flex-col px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        <section className="rounded-3xl border bg-card p-8 shadow-sm sm:p-14">
          <h1 className="max-w-2xl text-3xl font-semibold leading-snug tracking-tight sm:text-5xl">
            {t("home.title")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("home.subtitle")}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              {t("home.cta")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/admin"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              {t("home.staff")}
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-5 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <span className="grid size-11 place-items-center rounded-lg bg-secondary text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-5 font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </section>

        <p className="mt-10 inline-flex items-center gap-2 self-start rounded-full border bg-card px-4 py-1.5 text-xs text-muted-foreground">
          <span
            className={`size-2 rounded-full ${officeName ? "bg-emerald-500" : "bg-amber-500"}`}
          />
          {officeName ? t("home.connected") : t("home.notConnected")}
        </p>
      </div>
    </main>
  );
}

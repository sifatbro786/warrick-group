import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/dal";
import LoginForm from "@/components/admin/forms/LoginForm";

export const metadata = { title: "Sign in" };

/**
 * The brand panel and the form chrome are static; only the session check
 * (already signed in → /admin) and ?next= wait on the request.
 */
export default function LoginPage({ searchParams }) {
    return (
        <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <aside className="relative hidden overflow-hidden bg-royal-night lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                {/* The crown, oversized and nearly invisible, as a watermark. */}
                <Image
                    src="/logo.png"
                    alt=""
                    width={552}
                    height={435}
                    sizes="560px"
                    className="pointer-events-none absolute -right-24 -bottom-16 w-[35rem] max-w-none opacity-[0.05]"
                />
                <div className="relative flex items-center gap-3">
                    <Image src="/logo.png" alt="" width={552} height={435} sizes="40px" className="h-8 w-auto" priority />
                    <span className="font-display text-[15px] font-bold tracking-[0.02em] text-white">WARRICK</span>
                </div>
                <div className="relative max-w-sm">
                    <span className="rule-gold mb-8 w-12" aria-hidden="true" />
                    <p className="font-display text-[34px] leading-[1.1] font-semibold text-white xl:text-[40px]">
                        The group&rsquo;s editorial desk.
                    </p>
                    <p className="mt-5 text-[14px] leading-relaxed text-white/55">
                        Every page, release and inquiry on the website is managed from here.
                    </p>
                </div>
                <p className="relative text-[12px] text-white/35">Authorised personnel only. Activity is logged.</p>
            </aside>

            <main className="flex items-center justify-center px-5 py-12 sm:px-10">
                <div className="w-full max-w-sm">
                    <div className="mb-10 flex items-center gap-2.5 lg:hidden">
                        <Image src="/logo.png" alt="" width={552} height={435} sizes="32px" className="h-7 w-auto" priority />
                        <span className="font-display text-[14px] font-bold tracking-[0.02em] text-royal-dark">WARRICK</span>
                    </div>
                    <p className="eyebrow text-gold-dark">Dashboard</p>
                    <h1 className="mt-3 text-[28px] leading-tight font-semibold text-royal">Sign in</h1>
                    <p className="mt-2 text-[14px] text-ink-muted">Use the email and password your administrator gave you.</p>
                    <div className="mt-8">
                        <Suspense fallback={<LoginForm next="" />}>
                            <SessionGate searchParams={searchParams} />
                        </Suspense>
                    </div>
                </div>
            </main>
        </div>
    );
}

async function SessionGate({ searchParams }) {
    if (await getCurrentUser()) redirect("/admin");
    const { next } = await searchParams;
    return <LoginForm next={typeof next === "string" ? next : ""} />;
}

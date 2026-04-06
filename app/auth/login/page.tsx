import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Giriş yap",
  description: "Hesabınıza giriş yapın",
};

type Props = { searchParams: Promise<{ from?: string | string[] }> };

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const s = Array.isArray(value) ? value[0] : value;
  return typeof s === "string" ? s : undefined;
}

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  return <LoginForm from={firstSearchParam(sp.from)} />;
}

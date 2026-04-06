import { OTPForm } from "@/components/otp-form";

type Props = { searchParams: Promise<{ success?: string }> };

export default async function OTPPage({ searchParams }: Props) {
  const params = await searchParams;
  const successMessage = params.success
    ? decodeURIComponent(params.success)
    : undefined;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[min(100%,20rem)]">
      <OTPForm initialSuccessMessage={successMessage} />
    </div>
  );
}

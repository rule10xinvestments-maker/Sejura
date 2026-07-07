import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  return <AuthForm authError={searchParams?.error} mode="sign-up" />;
}

import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  return <AuthForm authError={searchParams?.error} mode="sign-in" />;
}

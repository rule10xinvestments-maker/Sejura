import { redirect } from "next/navigation";

export default function AdminPropertyRedirectPage({
  params
}: {
  params: { propertyId: string };
}) {
  redirect(`/admin/owners?property=${params.propertyId}`);
}

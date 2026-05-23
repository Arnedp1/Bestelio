import { redirect } from "next/navigation";

export default async function NewProductRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { categoryId } = await searchParams;
  const q = categoryId ? `?new=1&categoryId=${categoryId}` : "?new=1";
  redirect(`/admin/products${q}`);
}

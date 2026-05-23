import { redirect } from "next/navigation";

/** Oude categorie-URL's → menu op home met hash. */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/#${encodeURIComponent(slug)}`);
}

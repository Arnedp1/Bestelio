import { redirect } from "next/navigation";

/** Productdetail zit in een overlay op het menu; oude links sturen door naar home. */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  redirect("/");
}

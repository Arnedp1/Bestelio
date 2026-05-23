import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant/context";
import { prisma } from "@/lib/prisma";
import { getCart, setCart } from "@/lib/cart/cookie";
import { categoryModifiersInclude } from "@/lib/storefront/category-modifiers";
import { defaultModifierSelection, validateCategoryModifierSelection } from "@/lib/storefront/modifiers";
import { serializeModifierGroups } from "@/lib/storefront/serialize-modifiers";
import { cartLineKey, type Cart, type CartLine } from "@/lib/cart/types";

const addSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
  modifierOptionIds: z.array(z.string().cuid()).default([]),
});

const updateLineSchema = z.object({
  lineKey: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});

export async function GET() {
  const cart = await getCart();
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  const tenant = await requireTenant();
  const body = addSchema.parse(await request.json());

  const product = await prisma.product.findFirst({
    where: { id: body.productId, tenantId: tenant.id, isAvailable: true },
    include: {
      category: { include: { modifierGroups: categoryModifiersInclude } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const modifierGroups = serializeModifierGroups(product.category?.modifierGroups ?? []);
  const autoModifiers = defaultModifierSelection(modifierGroups);
  const validationError = validateCategoryModifierSelection(modifierGroups, [
    ...autoModifiers,
    ...body.modifierOptionIds,
  ]);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const validOptionIds = new Set(modifierGroups.flatMap((g) => g.options.map((o) => o.id)));
  const selectedIds = [...new Set([...autoModifiers, ...body.modifierOptionIds])].filter((id) =>
    validOptionIds.has(id)
  );
  const options = modifierGroups
    .flatMap((g) => g.options)
    .filter((o) => selectedIds.includes(o.id));

  const line: CartLine = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    unitPriceCents: product.priceCents,
    quantity: body.quantity,
    modifiers: options.map((o) => ({
      optionId: o.id,
      name: o.name,
      priceCents: o.priceCents,
    })),
  };

  const cart = await getCart();
  const key = cartLineKey(line);
  const existing = cart.lines.find((l) => cartLineKey(l) === key);
  if (existing) {
    existing.quantity += body.quantity;
  } else {
    cart.lines.push(line);
  }

  await setCart(cart);
  return NextResponse.json(cart);
}

export async function PATCH(request: Request) {
  const tenant = await requireTenant();
  const body = updateLineSchema.parse(await request.json());

  const cart = await getCart();
  const index = cart.lines.findIndex((l) => cartLineKey(l) === body.lineKey);
  if (index < 0) {
    return NextResponse.json({ error: "Regel niet gevonden in mand" }, { status: 404 });
  }

  if (body.quantity === 0) {
    cart.lines.splice(index, 1);
    await setCart(cart);
    return NextResponse.json(cart);
  }

  const line = cart.lines[index];
  const product = await prisma.product.findFirst({
    where: {
      id: line.productId,
      tenantId: tenant.id,
      isAvailable: true,
    },
  });

  if (!product) {
    cart.lines.splice(index, 1);
    await setCart(cart);
    return NextResponse.json(cart);
  }

  line.quantity = body.quantity;
  line.unitPriceCents = product.priceCents;
  line.name = product.name;
  line.slug = product.slug;

  await setCart(cart);
  return NextResponse.json(cart);
}

export async function DELETE() {
  await setCart({ lines: [] });
  return NextResponse.json({ lines: [] } satisfies Cart);
}

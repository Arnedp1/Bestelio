import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireTenant } from "@/lib/tenant/context";
import { getCart, clearCart, setCart } from "@/lib/cart/cookie";
import { resolveCartForTenant } from "@/lib/cart/resolve";
import {
  checkoutFieldErrors,
  checkoutSchema,
  checkoutValidationSummary,
} from "@/lib/validations/checkout";
import { createOrder } from "@/lib/orders/create";
import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/payments/config";
import { createOnlinePayment } from "@/lib/payments/provider";
import { getPaymentSetup } from "@/lib/payments/resolve";

export async function POST(request: Request) {
  try {
    const tenant = await requireTenant();
    const body = checkoutSchema.parse(await request.json());
    const rawCart = await getCart();
    const { cart, hadStaleLines } = await resolveCartForTenant(tenant.id, rawCart);

    if (hadStaleLines) {
      await setCart(cart);
    }

    if (cart.lines.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          reason: "invalid_cart",
          message:
            "Je winkelmand bevat producten die niet meer beschikbaar zijn. Voeg ze opnieuw toe vanuit het menu.",
        },
        { status: 400 }
      );
    }

    const settings = await prisma.businessSettings.findUnique({
      where: { tenantId: tenant.id },
    });

    const result = await createOrder({
      tenantId: tenant.id,
      fulfillment: body.fulfillment,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail || undefined,
      customerAddress: body.customerAddress,
      notes: body.notes,
      timeSlotInstanceId: body.timeSlotInstanceId,
      cart,
      minOrderCents: settings?.minOrderCents ?? 0,
    });

    if (!result.ok) {
      const status = result.reason === "min_order" ? 400 : 409;
      return NextResponse.json(result, { status });
    }

    const paymentSetup = await getPaymentSetup(tenant.id);
    const wantsPayOnline = body.payOnline || settings?.requireOnlinePayment;

    if (settings?.requireOnlinePayment && !paymentSetup.canPayOnline) {
      return NextResponse.json(
        {
          ok: false,
          reason: "payment_not_configured",
          message:
            "Online betalen is verplicht, maar Mollie is nog niet geconfigureerd. Neem contact op met de zaak.",
        },
        { status: 503 }
      );
    }

    const payOnline =
      wantsPayOnline &&
      settings?.onlinePaymentsEnabled &&
      settings.paymentProvider !== "MANUAL";

    if (payOnline && settings) {
      const requestOrigin = new URL(request.url).origin;
      const baseUrl = getPublicAppUrl(requestOrigin);
      const payment = await createOnlinePayment(settings.paymentProvider, tenant.id, {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        amountCents: result.totalCents,
        customerEmail: body.customerEmail || undefined,
        redirectUrl: `${baseUrl}/order/${result.orderId}?payment=return`,
        appBaseUrl: baseUrl,
      });

      if (payment.ok) {
        await prisma.payment.update({
          where: { orderId: result.orderId },
          data: {
            provider: settings.paymentProvider.toLowerCase(),
            providerRef: payment.providerRef,
          },
        });
        await clearCart();
        return NextResponse.json({
          ok: true,
          orderId: result.orderId,
          checkoutUrl: payment.checkoutUrl,
        });
      }

      return NextResponse.json(
        {
          ok: false,
          reason: "payment_failed",
          message: payment.error,
          orderId: result.orderId,
        },
        { status: 502 }
      );
    }

    await clearCart();
    return NextResponse.json({
      ok: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (e) {
    if (e instanceof ZodError) {
      const fieldErrors = checkoutFieldErrors(e);
      return NextResponse.json(
        {
          ok: false,
          reason: "validation",
          fieldErrors,
          message: checkoutValidationSummary(fieldErrors),
        },
        { status: 400 }
      );
    }
    console.error("[checkout]", e);
    return NextResponse.json(
      { ok: false, reason: "server_error", message: "Afrekenen mislukt. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/?newsletter=error", req.url)
    );
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { confirmToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(
      new URL("/?newsletter=error", req.url)
    );
  }

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      confirmed: true,
      confirmToken: null,
    },
  });

  return NextResponse.redirect(
    new URL("/?newsletter=confirmed", req.url)
  );
}

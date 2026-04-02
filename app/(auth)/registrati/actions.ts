"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function registerAction(formData: FormData) {
  const nome = (formData.get("nome") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confermaPassword = formData.get("confermaPassword") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/impara";

  if (!nome || !email || !password || !confermaPassword) {
    return { error: "Tutti i campi sono obbligatori" };
  }

  if (password !== confermaPassword) {
    return { error: "Le password non coincidono" };
  }

  if (password.length < 8) {
    return { error: "La password deve essere di almeno 8 caratteri" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Esiste già un account con questa email" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: nome,
      email,
      passwordHash,
      role: "STUDENT",
    },
  });

  // Auto-login after registration
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    return { error: "Registrazione completata, ma accesso automatico fallito. Effettua il login." };
  }

  redirect(callbackUrl);
}

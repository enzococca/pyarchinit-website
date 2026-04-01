"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginStudentAction(formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string) || "/impara";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch {
    return { error: "Username o password non validi" };
  }
  redirect(callbackUrl);
}

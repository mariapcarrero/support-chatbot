"use server";

import { revalidatePath } from "next/cache";

import {
  clearAllEscalations,
  clearAllLeads,
  deleteEscalation,
  deleteLead,
} from "@/lib/db/repository";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertId(id: string): string {
  if (!UUID_RE.test(id)) throw new Error("Invalid id");
  return id;
}

export async function deleteLeadAction(id: string): Promise<void> {
  await deleteLead(assertId(id));
  revalidatePath("/admin");
}

export async function deleteEscalationAction(id: string): Promise<void> {
  await deleteEscalation(assertId(id));
  revalidatePath("/admin");
}

export async function clearAllLeadsAction(): Promise<void> {
  await clearAllLeads();
  revalidatePath("/admin");
}

export async function clearAllEscalationsAction(): Promise<void> {
  await clearAllEscalations();
  revalidatePath("/admin");
}

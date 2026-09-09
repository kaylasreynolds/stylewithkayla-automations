import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const WORKSPACE_COOKIE = "zernflow_workspace_id";

/**
 * Cached per-request: deduplicates across layout + page in the same render.
 * Reads workspace ID from cookie if set; falls back to first workspace.
 */
export const getWorkspace = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("[workspace-debug] auth", {
    hasUser: Boolean(user),
    userIdPrefix: user?.id.slice(0, 8) ?? null,
    error: userError?.message ?? null,
  });

  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const selectedId = cookieStore.get(WORKSPACE_COOKIE)?.value;

  console.log("[workspace-debug] selected workspace", {
    selectedId: selectedId ?? null,
  });

  // Try cookie workspace first
  if (selectedId) {
    const { data: membership, error: selectedMembershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, workspaces(*)")
      .eq("user_id", user.id)
      .eq("workspace_id", selectedId)
      .single();

    console.log("[workspace-debug] selected membership", {
      found: Boolean(membership),
      workspaceId: membership?.workspace_id ?? null,
      role: membership?.role ?? null,
      hasWorkspace: Boolean(membership?.workspaces),
      error: selectedMembershipError?.message ?? null,
    });

    if (membership?.workspaces) {
      return {
        user,
        workspace: membership.workspaces,
        role: membership.role,
        supabase,
      };
    }
  }

  // Fallback to first workspace
  const { data: membership, error: fallbackMembershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  console.log("[workspace-debug] fallback membership", {
    found: Boolean(membership),
    workspaceId: membership?.workspace_id ?? null,
    role: membership?.role ?? null,
    hasWorkspace: Boolean(membership?.workspaces),
    error: fallbackMembershipError?.message ?? null,
  });

  if (!membership?.workspaces) redirect("/login");

  return {
    user,
    workspace: membership.workspaces,
    role: membership.role,
    supabase,
  };
});

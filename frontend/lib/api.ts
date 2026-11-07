const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export interface LicenseVerifyResult {
  is_pro: boolean;
  plan_tier: string;
  daily_remaining: number;
  daily_limit: number;
  expires_at: string | null;
  user_id?: string;
  email?: string;
}

export interface NotesGenerateResult {
  markdown: string;
  key_takeaways: string[];
  svg_flowchart?: string | null;
  daily_remaining: number;
}

export async function verifyLicense(userToken: string, productId: string = "notesgpt"): Promise<LicenseVerifyResult> {
  const res = await fetch(`${API_BASE}/license/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_token: userToken, product_id: productId }),
  });
  if (!res.ok) {
    throw new Error(`License verification failed with status: ${res.status}`);
  }
  return res.json();
}

export async function generateNotesProxy(
  userToken: string,
  payload: { transcript_window: string; frame_base64?: string | null; lang?: string; include_mindmap?: boolean }
): Promise<NotesGenerateResult> {
  const res = await fetch(`${API_BASE}/notes/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 402) {
      throw new Error("Daily quota exceeded. Please upgrade to Pro in the AQVONX Dashboard.");
    }
    throw new Error(`Notes generation failed with status: ${res.status}`);
  }
  return res.json();
}


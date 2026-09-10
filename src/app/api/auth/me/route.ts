import { NextResponse } from "next/server";
import { getSession, createBasicAuthHeader } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const apiUrl = process.env.HELIOS_API_URL || "https://demo-api.helios.eu";
  let profile = null;

  try {
    const authHeader = createBasicAuthHeader(session.userName, session.userId);
    const res = await fetch(`${apiUrl}/api/Connect/UserInfo`, {
      headers: {
        Authorization: authHeader,
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      profile = await res.json();
    }
  } catch {
    // Return fallback session data if UserInfo fetch fails
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userName: session.userName,
      userId: session.userId,
      dbProfile: session.dbProfile,
      serverURL: session.serverURL,
      languageId: session.languageId,
      profile,
    },
  });
}

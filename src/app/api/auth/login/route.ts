import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userName = body.userName?.trim();
    const password = body.password;
    const dbProfile = body.dbProfile?.trim() || process.env.HELIOS_DB_PROFILE || "Demo";
    const serverURL = body.serverURL?.trim() || process.env.HELIOS_SERVER_URL || "https://open.helios.eu/DemoNephrite";
    const languageId = body.languageId?.trim() || process.env.HELIOS_LANGUAGE_ID || "CZ";
    const apiUrl = process.env.HELIOS_API_URL || "https://demo-api.helios.eu";

    if (!userName || !password) {
      return NextResponse.json(
        { success: false, errorMessage: "Uživatelské jméno a heslo jsou povinné." },
        { status: 400 }
      );
    }

    const payload = {
      userName,
      password,
      useWindowsAuthentication: false,
      useCurrentUserCredentials: false,
      languageId,
      dbProfile,
      serverURL,
    };

    const heliosRes = await fetch(`${apiUrl}/api/connect/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await heliosRes.json().catch(() => null);

    if (!heliosRes.ok || !data?.success || !data?.userId) {
      const msg = data?.errorMessage || "Přihlášení k Helios Nephrite se nezdařilo. Zkontrolujte jméno a heslo.";
      return NextResponse.json({ success: false, errorMessage: msg }, { status: 401 });
    }

    await setSession({
      userName: data.userName || userName,
      userId: data.userId,
      serverURL,
      dbProfile,
      languageId,
    });

    return NextResponse.json({
      success: true,
      userName: data.userName || userName,
      userId: data.userId,
      dbProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chyba při komunikaci se serverem Helios.";
    return NextResponse.json({ success: false, errorMessage: message }, { status: 500 });
  }
}

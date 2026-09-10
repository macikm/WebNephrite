import { cookies } from "next/headers";

export interface SessionData {
  userName: string;
  userId: string;
  serverURL: string;
  dbProfile: string;
  languageId: string;
}

const SESSION_COOKIE_NAME = "webnephrite_session";

export async function setSession(data: SessionData) {
  const cookieStore = await cookies();
  const serialized = Buffer.from(JSON.stringify(data)).toString("base64");
  cookieStore.set(SESSION_COOKIE_NAME, serialized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return null;
  }
  try {
    const raw = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function createBasicAuthHeader(userName: string, userId: string): string {
  const token = Buffer.from(`${userName}:${userId}`).toString("base64");
  return `Basic ${token}`;
}

import { NextRequest, NextResponse } from "next/server";
import { getSession, createBasicAuthHeader } from "@/lib/auth";

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný přístup. Přihlaste se prosím." }, { status: 401 });
  }

  const path = params.path.join("/");
  const apiUrl = process.env.HELIOS_API_URL || "https://demo-api.helios.eu";
  const url = new URL(`${apiUrl}/api/${path}`);

  // Forward query parameters
  request.nextUrl.searchParams.forEach((val, key) => {
    url.searchParams.set(key, val);
  });

  const authHeader = createBasicAuthHeader(session.userName, session.userId);
  const headers: Record<string, string> = {
    Authorization: authHeader,
    Accept: "application/json",
  };

  let bodyData: string | undefined = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers["Content-Type"] = "application/json";
    try {
      bodyData = await request.text();
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: bodyData,
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    }

    if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: res.status,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": res.headers.get("content-disposition") || "inline",
        },
      });
    }

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chyba při komunikaci s Helios API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params);
}

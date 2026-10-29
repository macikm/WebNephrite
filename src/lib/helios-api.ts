import { getSession, createBasicAuthHeader } from "@/lib/auth";

export interface HeliosAuthCredentials {
  userName?: string;
  password?: string;
  apiUrl?: string;
  authorization?: string;
}

/**
 * Resolves credentials from request headers, session cookie, or environment variables.
 */
export async function resolveHeliosCredentials(
  headers?: Record<string, string | undefined>
): Promise<{ authHeader: string; apiUrl: string }> {
  const normHeaders: Record<string, string> = {};
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (v !== undefined) {
        normHeaders[k.toLowerCase()] = String(v);
      }
    }
  }

  const apiUrl =
    normHeaders["x-helios-url"] ||
    process.env.HELIOS_API_URL ||
    "https://demo-api.helios.eu";

  // 1. Direct custom headers: X-Helios-User & X-Helios-Password
  const headerUser = normHeaders["x-helios-user"] || normHeaders["x-helios-username"];
  const headerPass = normHeaders["x-helios-password"] || normHeaders["x-helios-key"] || "";
  if (headerUser) {
    return {
      authHeader: createBasicAuthHeader(headerUser, headerPass),
      apiUrl: apiUrl.replace(/\/+$/, ""),
    };
  }

  // 2. Direct Authorization header (Basic or Bearer)
  const directAuth = normHeaders["authorization"];
  if (directAuth && (directAuth.startsWith("Basic ") || directAuth.startsWith("Bearer "))) {
    return {
      authHeader: directAuth,
      apiUrl: apiUrl.replace(/\/+$/, ""),
    };
  }

  // 3. Fallback to Environment variables
  const envUser = process.env.HELIOS_USER || process.env.HELIOS_MCP_USER;
  const envPass = process.env.HELIOS_PASSWORD || process.env.HELIOS_MCP_PASSWORD || "";
  if (envUser) {
    return {
      authHeader: createBasicAuthHeader(envUser, envPass),
      apiUrl: apiUrl.replace(/\/+$/, ""),
    };
  }

  // 4. Fallback to browser session cookie (if called from authenticated web context)
  try {
    const session = await getSession();
    if (session?.userName) {
      return {
        authHeader: createBasicAuthHeader(session.userName, session.userId),
        apiUrl: (session.serverURL || apiUrl).replace(/\/+$/, ""),
      };
    }
  } catch {
    // getSession might fail if called outside Request context
  }

  throw new Error(
    "Chybí přihlašovací údaje k Helios Nephrite. Zadejte hlavičky X-Helios-User a X-Helios-Password, nebo nastavte proměnné prostředí HELIOS_USER a HELIOS_PASSWORD."
  );
}

/**
 * Universal caller to Helios REST API.
 */
export async function callHeliosApi<T = unknown>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string | undefined>;
  } = {}
): Promise<{ status: number; ok: boolean; data: T }> {
  const { authHeader, apiUrl } = await resolveHeliosCredentials(options.headers);

  const cleanPath = path.replace(/^\/+/, "");
  const targetUrl = new URL(`${apiUrl}/api/${cleanPath}`);

  if (options.query) {
    for (const [key, val] of Object.entries(options.query)) {
      if (val !== undefined && val !== null) {
        targetUrl.searchParams.set(key, String(val));
      }
    }
  }

  const reqHeaders: Record<string, string> = {
    Authorization: authHeader,
    Accept: "application/json",
  };

  let bodyStr: string | undefined = undefined;
  if (options.body !== undefined && options.method !== "GET" && options.method !== "DELETE") {
    reqHeaders["Content-Type"] = "application/json";
    bodyStr = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(targetUrl.toString(), {
    method: options.method || "GET",
    headers: reqHeaders,
    body: bodyStr,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  let responseData: any = null;

  if (contentType.includes("application/json")) {
    try {
      responseData = await res.json();
    } catch {
      responseData = null;
    }
  } else {
    responseData = await res.text();
  }

  if (!res.ok) {
    const errorMsg =
      responseData?.error ||
      responseData?.message ||
      (typeof responseData === "string" ? responseData : `Helios API vrátilo HTTP ${res.status}`);
    throw new Error(`Helios API chyba [${res.status}]: ${errorMsg}`);
  }

  return {
    status: res.status,
    ok: res.ok,
    data: responseData as T,
  };
}

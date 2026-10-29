import { getSession, createBasicAuthHeader } from "@/lib/auth";

export interface HeliosAuthCredentials {
  userName?: string;
  password?: string;
  apiUrl?: string;
  authorization?: string;
}

// In-memory session key cache to avoid re-logging in on every single API request
const loginSessionCache = new Map<string, { userId: string; expiresAt: number }>();

async function loginToHelios(
  apiUrl: string,
  userName: string,
  password: string,
  options: {
    dbProfile?: string;
    serverURL?: string;
    languageId?: string;
    forceRefresh?: boolean;
  } = {}
): Promise<string> {
  const cacheKey = `${apiUrl}::${userName}::${password}`;
  const now = Date.now();

  if (!options.forceRefresh) {
    const cached = loginSessionCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.userId;
    }
  } else {
    loginSessionCache.delete(cacheKey);
  }

  const payload = {
    userName,
    password,
    useWindowsAuthentication: false,
    useCurrentUserCredentials: false,
    languageId: options.languageId || process.env.HELIOS_LANGUAGE_ID || "CZ",
    dbProfile: options.dbProfile || process.env.HELIOS_DB_PROFILE || "Demo",
    serverURL: options.serverURL || process.env.HELIOS_SERVER_URL || "https://open.helios.eu/DemoNephrite",
  };

  const cleanApiUrl = apiUrl.replace(/\/+$/, "");
  const loginRes = await fetch(`${cleanApiUrl}/api/connect/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await loginRes.json().catch(() => null);

  if (!loginRes.ok || !data?.success || !data?.userId) {
    const msg = data?.errorMessage || `Přihlášení k Helios Nephrite se nezdařilo (HTTP ${loginRes.status}).`;
    throw new Error(`Helios Login selhal: ${msg}`);
  }

  // Cache token for 20 minutes
  loginSessionCache.set(cacheKey, {
    userId: data.userId,
    expiresAt: now + 20 * 60 * 1000,
  });

  return data.userId;
}

/**
 * Resolves credentials from request headers, session cookie, or environment variables.
 * Automatically exchanges (userName + password) for a Helios session UserId token via /api/connect/login.
 */
export async function resolveHeliosCredentials(
  headers?: Record<string, string | undefined>,
  forceRefresh = false
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

  // 1. Direct custom headers: X-Helios-User & X-Helios-Password (or Key)
  const headerUser = normHeaders["x-helios-user"] || normHeaders["x-helios-username"];
  const headerPass = normHeaders["x-helios-password"] || normHeaders["x-helios-key"] || "";

  if (headerUser) {
    // If password is already a raw "UserId <hash>", use it directly
    if (headerPass.startsWith("UserId ") || headerPass.startsWith("Basic ")) {
      const authHeader = headerPass.startsWith("Basic ")
        ? headerPass
        : createBasicAuthHeader(headerUser, headerPass);
      return { authHeader, apiUrl: apiUrl.replace(/\/+$/, "") };
    }

    // Otherwise, perform login handshake via /api/connect/login to obtain security UserId
    const userId = await loginToHelios(apiUrl, headerUser, headerPass, {
      dbProfile: normHeaders["x-helios-dbprofile"],
      serverURL: normHeaders["x-helios-serverurl"],
      languageId: normHeaders["x-helios-language"],
      forceRefresh,
    });

    return {
      authHeader: createBasicAuthHeader(headerUser, userId),
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
    if (envPass.startsWith("UserId ")) {
      return {
        authHeader: createBasicAuthHeader(envUser, envPass),
        apiUrl: apiUrl.replace(/\/+$/, ""),
      };
    }
    const userId = await loginToHelios(apiUrl, envUser, envPass, { forceRefresh });
    return {
      authHeader: createBasicAuthHeader(envUser, userId),
      apiUrl: apiUrl.replace(/\/+$/, ""),
    };
  }

  // 4. Fallback to browser session cookie (if called from authenticated web context)
  try {
    const session = await getSession();
    if (session?.userName && session?.userId) {
      return {
        authHeader: createBasicAuthHeader(session.userName, session.userId),
        apiUrl: apiUrl.replace(/\/+$/, ""),
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
 * Universal caller to Helios REST API with automatic 401 re-login retry.
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
  let { authHeader, apiUrl } = await resolveHeliosCredentials(options.headers);

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

  let res = await fetch(targetUrl.toString(), {
    method: options.method || "GET",
    headers: reqHeaders,
    body: bodyStr,
    cache: "no-store",
  });

  // If 401 Unauthorized, automatically invalidate cached token and retry once with a fresh login!
  if (res.status === 401) {
    try {
      const fresh = await resolveHeliosCredentials(options.headers, true);
      reqHeaders.Authorization = fresh.authHeader;
      res = await fetch(targetUrl.toString(), {
        method: options.method || "GET",
        headers: reqHeaders,
        body: bodyStr,
        cache: "no-store",
      });
    } catch {
      // ignore retry failure and let standard error reporting handle it
    }
  }

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

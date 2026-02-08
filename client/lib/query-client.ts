import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getCachedToken } from "@/lib/auth-token";

export function getApiUrl(): string {
  const host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }

  // Clean the host by removing any existing http:// or https:// to prevent double protocols
  const cleanHost = host.replace(/^https?:\/\//, '');

  // Return a consistent, absolute URL
  return `https://${cleanHost}`;
}

function getAuthHeaders(): Record<string, string> {
  const token = getCachedToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();

  // Ensure the route is clean and the baseUrl is properly formatted
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  const url = new URL(cleanRoute, baseUrl);

  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.href, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const cleanRoute = queryKey.join("/");
    const url = new URL(cleanRoute.startsWith('/') ? cleanRoute : `/${cleanRoute}`, baseUrl);

    const res = await fetch(url.href, {
      credentials: "include",
      headers: getAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
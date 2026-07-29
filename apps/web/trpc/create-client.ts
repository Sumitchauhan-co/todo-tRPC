import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

let memoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const getAccessToken = () => memoryAccessToken;

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;

  const rawBaseUrl = env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const url = `${rawBaseUrl.replace(/\/+$/, "")}/trpc`;

  return c({
    url,
    async fetch(input, options) {
      const headers = new Headers(options?.headers);

      const token = getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(input, {
        ...options,
        headers,
        credentials: "include",
      });

      const newAccessToken = response.headers.get("x-new-access-token");
      if (newAccessToken) {
        setAccessToken(newAccessToken);
      }

      return response;
    },
  });
};

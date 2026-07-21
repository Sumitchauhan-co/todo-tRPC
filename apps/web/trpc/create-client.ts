import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;

  const rawBaseUrl = env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const url = `${rawBaseUrl.replace(/\/+$/, "")}/trpc`;

  return c({
    url,
    headers() {
      if (typeof window === "undefined") {
        return {};
      }

      const accessToken = window.localStorage.getItem("todo_access_token");

      return accessToken
        ? {
            authorization: `Bearer ${accessToken}`,
          }
        : {};
    },
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
};

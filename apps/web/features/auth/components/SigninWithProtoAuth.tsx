"use client";

import React from "react";
import { ShieldUser } from "lucide-react";

import { Button } from "~/components/ui/button";

function generateCodeVerifier(length = 64) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join("");
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);

  const bytes = new Uint8Array(digest);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const SigninWithProtoAuth = () => {
  const handleProtoAuthLogin = async () => {
    const clientId = process.env.NEXT_PUBLIC_PROTOAUTH_CLIENT_ID || "";
    const redirectUri = `${window.location.origin}/todos`;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    localStorage.setItem("protoauth_code_verifier", codeVerifier);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    window.location.href = `https://protoauth.vercel.app/o/authenticate?${params.toString()}`;
  };

  return (
    <Button
      type="button"
      onClick={handleProtoAuthLogin}
      className="w-full gap-2 bg-black text-white hover:bg-neutral-800"
    >
      <ShieldUser className="size-4" />
      Sign in with ProtoAuth
    </Button>
  );
};

export default SigninWithProtoAuth;

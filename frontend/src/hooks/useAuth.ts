import { useMutation } from "@tanstack/react-query";
import { API_URL } from "./api";

export function useWalletSignIn() {
  return useMutation({
    // Updated to accept both address and signature
    mutationFn: async ({
      address,
      signature,
    }: {
      address: string;
      signature: string;
    }) => {
      // Endpoint changed to match your swagger: /auth/wallet
      const res = await fetch(`${API_URL}/auth/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });

      if (!res.ok) throw new Error("Sign in failed");

      const data = await res.json();
      // Assuming your API returns { access_token: "..." }
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        return data.access_token;
      }
      return null;
    },
  });
}


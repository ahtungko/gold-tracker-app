import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import React from "react";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { registerSW } from "virtual:pwa-register";

declare global {
  interface Window {
    __PWA_SW_REGISTERED__?: boolean;
  }
}

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const globalWindow = window as Window & { __PWA_SW_REGISTERED__?: boolean };

  if (!globalWindow.__PWA_SW_REGISTERED__) {
    globalWindow.__PWA_SW_REGISTERED__ = true;

    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateServiceWorker(true);
      },
      onOfflineReady() {
        console.info("[PWA] Offline cache ready");
      },
      onRegisterError(error) {
        globalWindow.__PWA_SW_REGISTERED__ = false;
        console.error("[PWA] Service worker registration failed", error);
      },
    });
  }
}

const queryClient = new QueryClient();

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </QueryClientProvider>
  </trpc.Provider>
);

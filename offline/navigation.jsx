import { useSyncExternalStore } from "react";
export const subscribe = (listener) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};
export function locationSnapshot() {
  return window.location.hash.startsWith("#/")
    ? window.location.hash.slice(1)
    : "/";
}
export function usePathname() {
  return (
    useSyncExternalStore(subscribe, locationSnapshot, () => "/")
      .split(/[?#]/)[0]
      .replace(/\/$/, "") || "/"
  );
}
export function notFound() {
  throw new Error("Страница не найдена");
}

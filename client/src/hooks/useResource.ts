import { useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api";

export function useResource<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const key = `${path}:${version}`;
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: string;
  }>({ key: "", data: null, error: "" });
  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ key, data: null, error: errorMessage(error) });
      });
    return () => controller.abort();
  }, [path, key]);
  return {
    data: path !== null && result.key === key ? result.data : null,
    error: path !== null && result.key === key ? result.error : "",
    loading: path !== null && result.key !== key,
    reload: () => setVersion((value) => value + 1),
    update: (transform: (data: T) => T) =>
      setResult((current) =>
        current.key === key && current.data !== null
          ? { ...current, data: transform(current.data) }
          : current,
      ),
  };
}

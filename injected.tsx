(function () {
  if (typeof window === "undefined") return;

  // ---------------- LOG FORWARDING ----------------
  function safeStringify(value) {
    try {
      if (typeof value === "string") return value;
      return JSON.stringify(value);
    } catch {
      return "[Unserializable Object]";
    }
  }

  function forwardLog(method, args) {
    parent.postMessage({
      type: "forward-log",
      method,
      message: args.map(safeStringify).join(" "),
    });
  }

  const logMethods = new Set([
    "log",
    "warn",
    "error",
    "info",
    "debug",
    "table",
    "assert",
  ]);

  const proxiedConsole = new Proxy(console, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);

      if (typeof original === "function" && logMethods.has(prop)) {
        return (...args) => {
          forwardLog(prop, args);
          return original.apply(target, args);
        };
      }

      return original;
    },
  });

  try {
    window.console = proxiedConsole;
  } catch {
    Object.keys(proxiedConsole).forEach((key) => {
      try {
        window.console[key] = proxiedConsole[key];
      } catch {
        // ignore safely
      }
    });
  }

  // ---------------- ERROR HANDLING ----------------
  function forwardNetworkRequest(message) {
    parent.postMessage({
      type: "forward-network-request",
      message,
    });
  }

  window.addEventListener("error", (event) => {
    const err = event.error;

    if (err instanceof Error) {
      forwardLog("unhandlederror", {
        message: err.message,
        stack: err.stack,
        type: err.name,
      });
    } else {
      forwardLog("unhandlederror", {
        message:
          typeof err === "string"
            ? err
            : "Uncaught exception (non-Error object)",
      });
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;

    if (reason instanceof Error) {
      forwardLog("unhandledrejection", {
        message: reason.message,
        stack: reason.stack,
        type: reason.name,
      });
    } else {
      forwardLog("unhandledrejection", {
        message:
          typeof reason === "string"
            ? reason
            : "Unhandled rejection (non-Error object)",
      });
    }
  });

  const historyEvent = "__replit-history-event";

  // ---------------- REQUEST SERIALIZATION ----------------
  function serializeRequestBody(body) {
    if (!body) return undefined;

    try {
      if (typeof body === "string") return body;

      if (
        body instanceof ArrayBuffer ||
        body instanceof Uint8Array ||
        body instanceof Blob
      ) {
        return "[binary]";
      }

      if (body instanceof FormData) {
        return (
          "FormData: " +
          Array.from(body.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join("&")
        );
      }

      if (body instanceof URLSearchParams) {
        return body.toString();
      }

      return JSON.stringify(body);
    } catch {
      return "[Could not serialize body]";
    }
  }

  function extractHeaders(config) {
    if (!config?.headers) return {};

    try {
      if (config.headers instanceof Headers) {
        return Object.fromEntries(config.headers.entries());
      }
      return config.headers;
    } catch {
      return {};
    }
  }

  function createRequestInfo(fetchArgs) {
    const [url, config] = fetchArgs;

    return {
      url: typeof url === "string" ? url : url?.url || url?.href || String(url),
      method: config?.method || "GET",
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
      requestHeaders: extractHeaders(config),
      requestBody: serializeRequestBody(config?.body),
    };
  }

  async function extractResponseBody(response) {
    if (!response?.clone) return "[unreadable response]";

    try {
      const clone = response.clone();
      const contentType = clone.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        return await clone.json();
      }

      return await clone.text();
    } catch {
      return "[failed to read response]";
    }
  }

  // ---------------- FETCH INTERCEPTOR ----------------
  window.fetch = new Proxy(window.fetch, {
    async apply(target, thisArg, args) {
      const requestInfo = createRequestInfo(args);

      try {
        const response = await target.apply(thisArg, args);

        const responseBody = await extractResponseBody(response);

        forwardNetworkRequest({
          ...requestInfo,
          status: response.status,
          statusText: response.statusText,
          responseBody,
          responseHeaders: Object.fromEntries(response.headers.entries()),
        });

        return response;
      } catch (error) {
        forwardNetworkRequest({
          ...requestInfo,
          error: {
            message: error?.message || "Fetch error",
            stack: error?.stack || null,
          },
        });

        throw error;
      }
    },
  });

  // ---------------- HISTORY TRACKING ----------------
  function triggerHistoryEvent() {
    window.dispatchEvent(new Event(historyEvent));
  }

  window.history.pushState = new Proxy(window.history.pushState, {
    apply(target, thisArg, args) {
      Promise.resolve().then(triggerHistoryEvent);
      return Reflect.apply(target, thisArg, args);
    },
  });

  window.history.replaceState = new Proxy(window.history.replaceState, {
    apply(target, thisArg, args) {
      Promise.resolve().then(triggerHistoryEvent);
      return Reflect.apply(target, thisArg, args);
    },
  });
})();

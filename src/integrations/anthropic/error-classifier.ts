interface ApiError {
  status?: number;
  message: string;
}

export function classifyApiError(err: unknown): ApiError {
  if (err instanceof Error) {
    const msg = err.message;

    if ("status" in err) {
      const status = (err as { status: number }).status;
      if (status === 403) {
        return {
          status: 403,
          message: "Your Swiggy session has expired. Please reconnect.",
        };
      }
      if (status === 401) {
        return {
          status: 401,
          message: "Invalid API key. Please check your Anthropic API key.",
        };
      }
      if (status === 429) {
        return {
          status: 429,
          message: "Rate limit exceeded. Please wait a moment and try again.",
        };
      }
      if (status === 529) {
        return {
          status: 529,
          message: "Service is temporarily overloaded. Please try again in a moment.",
        };
      }
      if (status === 500) {
        return { status: 500, message: "Server error. Please try again later." };
      }
    }

    if (msg.includes("403") || msg.includes("Forbidden")) {
      return { status: 403, message: "Your Swiggy session has expired. Please reconnect." };
    }
    if (msg.includes("401")) {
      return {
        status: 401,
        message: "Invalid API key. Please check your Anthropic API key.",
      };
    }
    if (msg.includes("429")) {
      return {
        status: 429,
        message: "Rate limit exceeded. Please wait a moment and try again.",
      };
    }
    if (/(rate[_\s-]?limit|exceed(?:ed|s)?)/i.test(msg)) {
      return {
        status: 429,
        message: "Rate limit exceeded. Please wait a moment and try again.",
      };
    }
    if (
      /(overload(?:ed)?|overloaded_error|capacity|temporarily unavailable|internal server error|api_error)/i.test(msg)
    ) {
      return {
        status: 529,
        message: "Service is temporarily overloaded. Please try again in a moment.",
      };
    }
    if (
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("net::")
    ) {
      return {
        message: "Network error. Please check your connection and try again.",
      };
    }

    const MAX_ERROR_LENGTH = 200;
    const safeMsg = msg.length > MAX_ERROR_LENGTH
      ? msg.slice(0, MAX_ERROR_LENGTH) + "…"
      : msg;
    return { message: safeMsg };
  }
  return { message: "Something went wrong" };
}

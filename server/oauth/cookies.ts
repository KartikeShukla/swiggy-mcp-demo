export function parseCookies(rawCookieHeader: string | undefined): Record<string, string> {
  return (rawCookieHeader || "").split(";").reduce(
    (acc, cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      if (!name) return acc;
      acc[name] = valueParts.join("=");
      return acc;
    },
    {} as Record<string, string>,
  );
}

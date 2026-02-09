import { createContext, useContext } from "react";

export const PhoneFrameContext = createContext<HTMLDivElement | null>(null);

export function usePhoneFrame() {
  return useContext(PhoneFrameContext);
}

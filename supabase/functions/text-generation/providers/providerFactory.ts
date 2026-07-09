import { createAnthropicTextProvider } from "./anthropic.ts";
import type { TextProvider } from "./textProvider.ts";

export function createTextProvider(): TextProvider {
  return createAnthropicTextProvider();
}

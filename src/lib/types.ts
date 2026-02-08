export interface McpServerConfig {
  url: string;
  name: string;
}

export interface VerticalConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: "food" | "style" | "dining";
  icon: string;
  systemPrompt: string;
  welcomeMessage: string;
  examplePrompts: string[];
  mcpServer: McpServerConfig;
}

export interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  server_name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  is_error?: boolean;
  content?: unknown;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
  timestamp: number;
}

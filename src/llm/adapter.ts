export type AgentMessage = { role: "user" | "assistant"; content: string }
export type ToolCall = { name: string; arguments: Record<string, unknown>; result: string }
export type AgentReply = { reply: string; toolCalls: ToolCall[]; needsConfirmation: boolean }

export interface LlmAdapter {
  enviar(messages: AgentMessage[], execute: (name: string, input: Record<string, unknown>) => Promise<string>): Promise<AgentReply>
}

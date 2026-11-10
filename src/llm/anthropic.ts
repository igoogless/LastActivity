import Anthropic from "@anthropic-ai/sdk"
import type { AgentMessage, AgentReply, LlmAdapter, ToolCall } from "./adapter"
import { tools } from "../tools/oc"

const schemas: Record<string, Record<string, unknown>> = {
  oc_leer_paquete: { caso: { type: "string", description: "Carpeta del caso" } },
  oc_validar: { caso: { type: "string" }, paquete: { type: "object" } },
  oc_construir_payload: { caso: { type: "string" }, paquete: { type: "object" }, derivados: { type: "object" } },
  oc_generar_evidencia: { caso: { type: "string" } },
  oc_crear: { caso: { type: "string" }, payload: { type: "object" }, confirmado: { type: "boolean" } },
}

export class AnthropicAdapter implements LlmAdapter {
  private readonly client = new Anthropic()
  private readonly definitions = Object.entries(tools).map(([name, tool]) => ({ name, description: tool.description, input_schema: { type: "object" as const, properties: schemas[name], required: name === "oc_crear" ? ["caso", "payload"] : Object.keys(schemas[name]) } }))

  async enviar(messages: AgentMessage[], execute: (name: string, input: Record<string, unknown>) => Promise<string>): Promise<AgentReply> {
    const history: Anthropic.MessageParam[] = messages.map((message) => ({ role: message.role, content: message.content }))
    const toolCalls: ToolCall[] = []
    for (let iteration = 0; iteration < Number(process.env.MAX_AGENT_ITERATIONS ?? 12); iteration += 1) {
      const response = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
        max_tokens: 2048,
        system: "Usa las herramientas para todos los datos. No inventes valores. Si hay confirmaciones, pregunta explícitamente y no llames oc_crear hasta que el usuario confirme.",
        messages: history,
        tools: this.definitions,
      })
      const calls = response.content.filter((block) => block.type === "tool_use")
      if (!calls.length) {
        const reply = response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n") || "No pude completar la respuesta."
        return { reply, toolCalls, needsConfirmation: /confirm|confirmación/i.test(reply) }
      }
      history.push({ role: "assistant", content: response.content })
      const results = await Promise.all(calls.map(async (call) => {
        const result = await execute(call.name, call.input as Record<string, unknown>)
        toolCalls.push({ name: call.name, arguments: call.input as Record<string, unknown>, result })
        return { type: "tool_result" as const, tool_use_id: call.id, content: result }
      }))
      history.push({ role: "user", content: results })
    }
    return { reply: "Alcancé el límite de iteraciones. Revisa las llamadas ejecutadas y completa la información faltante.", toolCalls, needsConfirmation: false }
  }
}

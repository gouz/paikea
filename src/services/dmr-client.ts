import type {
  DMRChatChunk,
  DMRChatRequest,
  Model,
  StreamChunk,
  ToolDefinition,
} from "../types";

const DMR_BASE = "http://localhost:12434/engines/v1";

export async function listModels(): Promise<Model[]> {
  try {
    const res = await fetch(`${DMR_BASE}/models`);
    const data: unknown = await res.json();
    const typed = data as { data?: { id: string }[] };
    return (typed.data ?? []).map((m) => ({
      id: m.id,
      name: m.id.split("/").pop() ?? m.id,
    }));
  } catch {
    return [];
  }
}

interface StreamToolCallAcc {
  id: string;
  name: string;
  argsBuffer: string;
}

export async function* streamChat(
  messages: {
    role: string;
    content: string;
    tool_call_id?: string;
    name?: string;
  }[],
  model: string,
  tools?: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
  const body: DMRChatRequest & {
    tools?: {
      type: "function";
      function: { name: string; description: string; parameters: unknown };
    }[];
  } = {
    model,
    messages,
    stream: true,
  };

  if (tools && tools.length > 0) {
    body.tools = tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  const res = await fetch(`${DMR_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw new Error(`DMR error: ${res.status} ${res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No readable stream");
  const decoder = new TextDecoder();
  let buffer = "";

  const toolCallAccumulators = new Map<number, StreamToolCallAcc>();

  while (true) {
    if (signal?.aborted) {
      await reader.cancel().catch(() => {});
      return;
    }
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      if (data === "[DONE]") return;

      try {
        const chunk = JSON.parse(data) as DMRChatChunk;
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.reasoning_content) {
          yield { type: "thinking", text: delta.reasoning_content };
        }
        if (delta.content) {
          yield { type: "content", text: delta.content };
        }
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = delta.tool_calls.indexOf(tc);
            let acc = toolCallAccumulators.get(idx);
            if (!acc) {
              acc = { id: tc.id ?? "", name: tc.function.name, argsBuffer: "" };
              toolCallAccumulators.set(idx, acc);
            }
            if (tc.id) acc.id = tc.id;
            if (tc.function.name) acc.name = tc.function.name;
            acc.argsBuffer += tc.function.arguments;

            yield {
              type: "tool_call",
              id: acc.id,
              name: acc.name,
              arguments: tc.function.arguments,
            };
          }
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
}

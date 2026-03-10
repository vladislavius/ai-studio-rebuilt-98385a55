import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ты — ИИ-методист онлайн-академии, которая использует технологию обучения Л. Рона Хаббарда (Study Technology) в секулярном, прикладном контексте.

ТВОЯ ЗАДАЧА — на основе входных параметров сгенерировать массив пунктов контрольного листа (чекшита) для курса.

КЛЮЧЕВЫЕ ПРИНЦИПЫ:
1. Три барьера к обучению:
   - Отсутствие массы → демонстрации, модели, схемы, визуализации
   - Слишком крутой градиент → дробление на мелкие шаги, постепенное наращивание
   - Непонятые слова → системная работа со словарём, задания на проработку терминов

2. Типы заданий (используй все уместные):
   - read: изучение материала (чтение/просмотр)
   - write: эссе, письменные ответы с привязкой к реальным ситуациям
   - demo: демонстрация принципа на примере, модели, схеме
   - clay_demo: моделирование через визуальные элементы (блок-схемы, mind map)
   - drill: практическое упражнение, отработка навыков
   - checkout: устная/письменная проверка понимания по ключевым пунктам
   - word_clearing: прояснение ключевых терминов и понятий
   - starrate: проверка звёздной оценкой (углублённая проверка)

3. Структура должна:
   - Идти от простого к сложному
   - Каждый модуль начинать с прояснения слов (word_clearing)
   - Чередовать теорию и практику
   - Включать демонстрации для создания "массы"
   - Завершать модуль чек-аутом

ФОРМАТ ОТВЕТА — используй tool calling для возврата результата.

НЕ используй дословные цитаты из текстов Хаббарда. Формулируй прикладно и конкретно.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { course_title, target_audience, final_product, modules, time_frame_weeks } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Сгенерируй контрольный лист для курса:

Название: ${course_title}
Целевая аудитория: ${target_audience || "Не указана"}
Конечный продукт: ${final_product || "Не указан"}
Длительность: ${time_frame_weeks || 4} недель

Модули:
${(modules || []).map((m: any, i: number) => `${i + 1}. ${m.title} (уровень: ${m.complexity || "средний"}, темы: ${(m.topics || []).join(", ")})`).join("\n")}

Создай подробный пошаговый чекшит с 15-40 пунктами. Каждый пункт должен иметь конкретный заголовок и описание задания.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_checksheet",
              description: "Return the generated checksheet items array",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["read", "write", "demo", "clay_demo", "drill", "checkout", "word_clearing", "starrate"] },
                        title: { type: "string", description: "Short task title" },
                        content: { type: "string", description: "Detailed task description and instructions" },
                      },
                      required: ["type", "title", "content"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_checksheet" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Попробуйте позже." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const items = (parsed.items || []).map((item: any, idx: number) => ({
      id: crypto.randomUUID(),
      order: idx + 1,
      type: item.type,
      title: item.title,
      content: item.content,
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-checksheet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, topic, url, course_title, count } = await req.json();

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt = '';

    if (mode === 'ai_generate') {
      prompt = `Ты — профессиональный методист и составитель глоссариев.

Сгенерируй ${count || 20} ключевых терминов по теме "${topic}"${course_title ? ` для курса "${course_title}"` : ''}.

Для каждого термина дай:
- term: точный термин
- definition: краткое, ясное определение (1-3 предложения)
- example: пример использования в контексте (1 предложение)

Верни JSON массив объектов:
[{"term": "...", "definition": "...", "example": "..."}]

Только JSON, без markdown.`;
    } else if (mode === 'parse_url') {
      // First fetch the URL content
      const fetchRes = await fetch(url);
      if (!fetchRes.ok) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch URL: ${fetchRes.status}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const htmlContent = await fetchRes.text();
      
      // Truncate to avoid token limits
      const truncated = htmlContent.substring(0, 30000);
      
      prompt = `Ты — эксперт по извлечению терминов из текстов.

Из следующего текста/HTML страницы извлеки все термины с определениями и оформи в виде глоссария.

Текст страницы:
---
${truncated}
---

Для каждого термина дай:
- term: точный термин
- definition: краткое определение (1-3 предложения)
- example: пример использования если возможно (или null)

Верни JSON массив:
[{"term": "...", "definition": "...", "example": "..."}]

Только JSON, без markdown. Если терминов нет, верни пустой массив [].`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid mode. Use "ai_generate" or "parse_url"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const aiRes = await fetch(`${supabaseUrl}/functions/v1/ai-gateway`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'google/gemini-2.5-flash',
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI error:', errText);
      return new Response(
        JSON.stringify({ error: 'AI request failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiRes.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    
    // Clean up markdown fences
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let terms;
    try {
      terms = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ terms }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

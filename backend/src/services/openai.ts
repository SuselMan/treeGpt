import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_PROMPT = `Respond in GitHub-flavored Markdown. Use fenced code blocks with language tags.`;

export async function chat(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
  });
  const content = response.choices[0]?.message?.content;
  if (content == null) throw new Error('Empty OpenAI response');
  return content;
}

export async function* chatStream(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): AsyncGenerator<string> {
  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    stream: true,
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (typeof delta === 'string') yield delta;
  }
}

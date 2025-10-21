import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import yaml from "js-yaml";
import { PageSpec } from "@/schemas/page";
import { emitPage } from "./codegen";
import { ensureShadcnItem } from "./ensure";
import { collectComponentRefs } from "./spec-deps";

const DEFAULT_MODEL = process.env.APG_AGENT_MODEL ?? "gpt-4o-mini";
const DEFAULT_ENDPOINT = process.env.APG_AGENT_ENDPOINT ?? "https://api.openai.com/v1/chat/completions";

type ChatCompletionChunk = {
  choices: Array<{
    message?: { content?: string };
    delta?: { content?: string };
  }>;
};

function normaliseYaml(raw: string) {
  const fenced = raw.trim().match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  return (fenced ? fenced[1] : raw).trim();
}

async function callModel(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.APG_AGENT_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY (или APG_AGENT_API_KEY) не задан — установить ключ для запуска агента.");
  }

  const response = await fetch(DEFAULT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Ты помощник по генерации YAML DSL для маркетингового сайта. Отвечай только YAML без пояснений. Структура: page, route, layout, seo, optional imports, api, blocks, localeScope."
        },
        {
          role: "user",
          content: `Сгенерируй YAML-описание страницы по следующему запросу:\n\n${prompt}\n\nТребования:\n- Используй доступные блоки (hero, feature-list, data-table, faq, testimonial и т.д.).\n- Добавь секцию localeScope с [\"en\", \"ru\"].\n- Используй api-блоки только если явно требуются данные.`
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API вернуло ${response.status}: ${text}`);
  }

  const data = (await response.json()) as ChatCompletionChunk;
  const content =
    data.choices?.[0]?.message?.content ?? data.choices?.[0]?.delta?.content ?? "";
  if (!content.trim()) {
    throw new Error("Модель не вернула контент");
  }
  return normaliseYaml(content);
}

async function saveSpec(pageId: string, contents: string) {
  await fs.mkdir("dsl-pages", { recursive: true });
  const target = path.join("dsl-pages", `${pageId}.yaml`);
  await fs.writeFile(target, contents.trim() + "\n", "utf-8");
  return target;
}

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const initial = process.argv.slice(2).join(" ");
    const description = initial || (await rl.question("Опишите страницу простыми словами: "));
    if (!description.trim()) {
      console.error("Описание не задано — завершаем.");
      return;
    }

    console.log("\nЗапрашиваю YAML у модели...\n");
    const yamlSpec = await callModel(description);
    console.log("Предложенная спецификация:\n");
    console.log(yamlSpec);
    console.log("");

    const confirm = (await rl.question("Применить эту спецификацию? (y/N) ")).trim().toLowerCase();
    if (confirm !== "y" && confirm !== "yes") {
      console.log("Отменено пользователем.");
      return;
    }

    const candidate = yaml.load(yamlSpec);
    const parsed = PageSpec.safeParse(candidate);
    if (!parsed.success) {
      console.error("YAML не соответствует ожидаемой схеме:");
      for (const issue of parsed.error.issues) {
        console.error(`- ${issue.path.join(".") || "root"}: ${issue.message}`);
      }
      process.exitCode = 1;
      return;
    }
    const spec = parsed.data;
    const pageId = spec.page;

    const targetPath = path.join("dsl-pages", `${pageId}.yaml`);
    try {
      await fs.access(targetPath);
      const overwrite = (await rl.question(`Файл ${targetPath} уже существует. Перезаписать? (y/N) `))
        .trim()
        .toLowerCase();
      if (overwrite !== "y" && overwrite !== "yes") {
        console.log("Перезапись отменена.");
        return;
      }
    } catch {
      // файл отсутствует
    }

    const savedPath = await saveSpec(pageId, yamlSpec);
    const refs = collectComponentRefs(spec);
    for (const ref of refs) {
      await ensureShadcnItem(ref);
    }
    const emitted = await emitPage(spec);
    console.log(`\nYAML сохранён: ${savedPath}`);
    console.log(`Сгенерирована страница: ${emitted}`);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

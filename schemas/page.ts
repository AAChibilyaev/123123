import { z } from "zod";
const I18N = z.string().regex(/^@i18n\./);
export const DSLBlock = z.object({
  use: z.string(),
  variant: z.string().optional(),
  props: z.record(z.any()).default({}),
  children: z.array(z.any()).optional(),
  animation: z.string().optional(),
  loading: z
    .object({
      use: z.string(),
      props: z.record(z.any()).default({})
    })
    .optional()
});
export const APIBlock = z.object({
  id: z.string(),
  use: z.string(),
  props: z.record(z.any()).default({}),
  await: z.boolean().default(true)
});
export const PageSpec = z.object({
  page: z.string(),
  route: z.string(),
  layout: z.string().default("default"),
  ppr: z.object({ dynamic: z.enum(["force-static", "force-dynamic", "auto"]).optional() }).optional(),
  seo: z.object({ title: z.union([I18N, z.string()]), description: z.union([I18N, z.string()]).optional() }).optional(),
  imports: z.array(z.string()).default([]),
  blocks: z.array(DSLBlock).min(1),
  api: z.array(APIBlock).default([]),
  localeScope: z.array(z.string()).default(["en", "ru"])
});
export type TPageSpec = z.infer<typeof PageSpec>;
export type TDSLBlock = z.infer<typeof DSLBlock>;
export type TAPIBlock = z.infer<typeof APIBlock>;

import type { Database } from "@/lib/supabase/types";

/**
 * Формальные параметры для универсального Supabase API-блока.
 * `table` указывает таблицу, `select` — строку выбора,
 * `filters` позволяет пробросить частичные условия, а `limit`
 * ограничивает количество строк.
 */
type Tables = Database["public"]["Tables"];
type TableName = keyof Tables & string;
type RowFor<TName extends string> = TName extends keyof Tables
  ? Tables[TName]["Row"]
  : Record<string, unknown>;

export type SupabaseQueryParams<TName extends string = TableName> = {
  table: TName;
  select?: string;
  filters?: Partial<RowFor<TName>>;
  limit?: number;
  signal?: AbortSignal;
};

/**
 * Заглушка для серверного API-блока, который можно связать с Supabase SDK.
 * Возвращает пустой результат, чтобы генерация страниц не падала до внедрения реального клиента.
 */
export async function supabaseQuery<TName extends string = TableName>(
  _params: SupabaseQueryParams<TName>
): Promise<RowFor<TName>[]> {
  return [] as RowFor<TName>[];
}

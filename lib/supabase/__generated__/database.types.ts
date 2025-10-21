/**
 * Этот файл служит заглушкой для сгенерированных Supabase типов.
 * Замените его содержимое на реальный вывод `supabase gen types typescript`
 * или настройте CLI на перезапись этого пути.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TablesDefinition<Row = Record<string, unknown>, Insert = Row, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Record<string, unknown>[];
};

export type Database = {
  public: {
    Tables: Record<string, TablesDefinition>;
    Views: Record<string, TablesDefinition>;
    Functions: Record<string, unknown>;
    Enums: Record<string, string[]>;
    CompositeTypes: Record<string, unknown>;
  };
};

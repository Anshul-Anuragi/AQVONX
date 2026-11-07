export interface NotesGenerateRequest {
  frame_base64?: string | null;
  transcript_window: string;
  lang?: string;
  include_mindmap?: boolean;
}

export interface NotesGenerateResponse {
  markdown: string;
  svg_flowchart?: string | null;
  key_takeaways: string[];
  tokens_used?: number;
  daily_remaining: number;
}


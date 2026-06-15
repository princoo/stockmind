/** Max rows returned by StockPilot list tools (not paginated). */
export const AI_TOOL_LIST_MAX_ROWS = 5000;

export type AiToolListPayload<T> = {
  items: T[];
  total: number;
  returned: number;
  complete: boolean;
  note?: string;
};

export function buildAiToolListPayload<T>(
  items: T[],
  total: number,
): AiToolListPayload<T> {
  const complete = items.length >= total;
  const payload: AiToolListPayload<T> = {
    items,
    total,
    returned: items.length,
    complete,
  };
  if (!complete) {
    payload.note = `Result capped at ${AI_TOOL_LIST_MAX_ROWS} rows. Narrow filters or use exportProductsSpreadsheet for a full product export.`;
  }
  return payload;
}

export function stringifyAiToolList<T>(items: T[], total: number): string {
  return JSON.stringify(buildAiToolListPayload(items, total));
}

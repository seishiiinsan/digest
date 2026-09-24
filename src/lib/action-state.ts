export type ActionState = { status: "idle" } | { status: "success" | "error"; message: string };

export const idle: ActionState = { status: "idle" };

export const ok = (message: string): ActionState => ({ status: "success", message });
export const fail = (message: string): ActionState => ({ status: "error", message });

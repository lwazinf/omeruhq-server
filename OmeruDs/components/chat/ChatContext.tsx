"use client";

import { createContext, useContext } from "react";
import { ListData, ListRow } from "@/lib/types";

export interface ChatUI {
  openListSheet: (list: ListData, onSelect: (row: ListRow) => void) => void;
}

export const ChatContext = createContext<ChatUI>({
  openListSheet: () => {},
});

export const useChatUI = () => useContext(ChatContext);

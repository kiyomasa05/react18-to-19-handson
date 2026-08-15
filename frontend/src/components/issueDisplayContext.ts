import { createContext } from "react";

export type VoteUnit = "votes" | "票";

export const IssueDisplayContext = createContext<VoteUnit>("votes");

// The DevOps program's study notes, one file per week (the capstone is week 5). Each file is checked against the plan in
// migration 019 of the API repository: the topic lines must match word for word, and every link must answer HTTP 200.
import type { DayNotes } from "../studyNotes";
import { W1 } from "./notesW1";
import { W2 } from "./notesW2";
import { W3 } from "./notesW3";
import { W4, W5 } from "./notesW4";

export const DEVOPS_NOTES: Record<number, DayNotes[]> = { 1: W1, 2: W2, 3: W3, 4: W4, 5: W5 };

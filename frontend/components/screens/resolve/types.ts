"use client";

import type { FunctionCode, Question } from "@/types/oox";

export type ResolveScreenProps = {
  conflictBlock: FunctionCode[]; // [SystemWinner, UserWinner]
  resolvedBlock: FunctionCode[]; // [SelectedWinner] (空なら未選択)
  handleSelectOrder: (func: FunctionCode) => void;
  handleConfirmConflict: () => void;
  loading: boolean;
  conflictQuestion?: Question;
  resolveCount: number;
};

export type ResolveViewProps = {
  cards: ConflictCardProps[];
  hasSelection: boolean;
  loading: boolean;
  conflictQuestion: Question;
  isDetailOpen: boolean;
  resolveCount: number;
  onToggleDetail: () => void;
  onConfirm: () => void;
};

export type ConflictCardProps = {
  id: string;
  type: "system" | "user";
  functionCode: FunctionCode;
  title: string;
  description: string;
  isSelected: boolean;
  isOtherSelected: boolean;
  onClick: () => void;
  loading: boolean;
};

export type ResolveHeaderProps = {
  conflictQuestion: Question;
  isDetailOpen: boolean;
  resolveCount: number;
  onToggleDetail: () => void;
};

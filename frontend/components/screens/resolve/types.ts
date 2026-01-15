"use client";

import type { FunctionCode, Question } from "@/types/oox";

export type ResolveScreenProps = {
  conflictBlock: FunctionCode[]; // [SystemWinner, UserWinner]
  resolvedBlock: FunctionCode[]; // [SelectedWinner] (空なら未選択)
  handleSelectOrder: (func: FunctionCode) => void;
  handleConfirmConflict: () => void;
  loading: boolean;
  conflictQuestion?: Question;
};

export type ResolveViewProps = {
  systemWinner: FunctionCode;
  userWinner: FunctionCode;
  systemTitle: string;
  userTitle: string;
  systemDescription: string;
  userDescription: string;
  isSystemSelected: boolean;
  isUserSelected: boolean;
  hasSelection: boolean;
  loading: boolean;
  conflictQuestion: Question;
  isDetailOpen: boolean;
  onToggleDetail: () => void;
  onSelectSystem: () => void;
  onSelectUser: () => void;
  onConfirm: () => void;
};

export type ConflictCardProps = {
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
  onToggleDetail: () => void;
};

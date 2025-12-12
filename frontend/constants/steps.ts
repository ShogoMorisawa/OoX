export const OOX_STEPS = {
  START: "start",
  QUIZ: "quiz",
  RESOLVE: "resolve",
  HIERARCHY: "hierarchy",
  RESULT: "result",
} as const;

export type Step = (typeof OOX_STEPS)[keyof typeof OOX_STEPS];

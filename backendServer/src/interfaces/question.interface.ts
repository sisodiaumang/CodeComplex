import { Document } from "mongoose";

// ─────────────────────────────────────────────────────────────────────────
// Shape confirmed directly against a real export of the seeded question
// bank (13 array-topic problems) — every field below appeared, with the
// same keys, on every single document. Nothing here is guessed.
//
// One deliberate departure from the raw seed shape: `starterCode` and
// `functionSignature` are typed as `Record<string, string>` (plain object)
// rather than a Mongoose `Map`. A Mongoose Map looks convenient, but
// `JSON.stringify(someMap)` silently produces `{}` — every controller in
// this codebase does `res.json({ data: doc })` somewhere, and a Map field
// would vanish the moment it crosses an API response. Plain object avoids
// that trap and still allows any language key (not just cpp/python/java),
// so adding a language to the bank later needs no schema change.
// ─────────────────────────────────────────────────────────────────────────

export type QuestionDifficulty = "Easy" | "Medium" | "Hard";

// Lowercase, per-language keys used inside a question doc (starterCode,
// functionSignature, judgeConfig.language) — every seeded doc uses
// "cpp" | "python" | "java" today. Kept as `string` rather than a strict
// union so a new language can be added to the bank without a migration;
// note this is a *different* casing/namespace than Submission.language's
// uppercase enum (CPP/JAVA/PYTHON/JAVASCRIPT/TYPESCRIPT) — judge.service.ts
// is what bridges the two.
export type QuestionLanguageKey = string;

export interface IQuestionExample {
    input: string;
    output: string;
    explanation?: string;
}

export interface IQuestionTestCase {
    id: string;
    input: string;
    output: string;
    isVisible: boolean;
}

export interface IQuestionJudgeConfig {
    timeLimit: number; // milliseconds
    memoryLimit: number; // MB
    language: QuestionLanguageKey[];
}

export interface IQuestionScoring {
    // Only "binary" has been seen in the seeded data so far. "partial" is
    // included because `partialScoring` already exists as a sibling flag —
    // remove it from this union if partial scoring never actually ships.
    type: "binary" | "partial";
    maxScore: number;
    partialScoring: boolean;
}

export interface IQuestionBattleConfig {
    enabled: boolean;
    timeBonus: boolean;
    maxBattleScore: number;
}

export interface IQuestionTestCaseDistribution {
    visible: number;
    hidden: number;
    total: number;
}

// FIX (bug-fix battleType support): per the platform owner, BUG_FIX
// questions are "just like DSA" — same statement/test-case/judging shape,
// the only difference is the player starts from deliberately broken code
// instead of an empty stub. So rather than a whole separate model, a DSA
// question doc can just declare mode: "bug_fix" and supply
// `buggyStarterCode` alongside the normal (working) `starterCode`.
// `starterCode` is still required either way — for "solve" mode it's the
// usual empty-stub scaffold; for "bug_fix" mode it doubles as the
// reference/"intended fix" version, while `buggyStarterCode` is what
// actually gets shown to and submitted by the player.
export type QuestionMode = "solve" | "bug_fix";

export interface IQuestion extends Document<string> {
    // _id's type comes from the `Document<string>` generic above (Mongoose's
    // Document<T> uses T as the _id type, defaulting to Types.ObjectId).
    // Declaring it again here would be redundant — and re-declaring it as
    // a bare `_id: string` on top of `Document` (without the generic) is
    // exactly what produced TS2430 ("Types of property '_id' are
    // incompatible. Type 'string' is not assignable to type 'ObjectId'"),
    // since the inherited default still wins unless overridden through the
    // generic itself.

    title: string;
    slug: string;
    difficulty: QuestionDifficulty;
    topics: string[];
    statement: string;
    constraints: string[];
    examples: IQuestionExample[];

    // Defaults to "solve" (the original 13 seeded questions are all this
    // mode). "bug_fix" reuses everything else on this model unchanged —
    // see the QuestionMode comment above.
    mode: QuestionMode;

    starterCode: Record<QuestionLanguageKey, string>;
    // Only meaningful when mode === "bug_fix": the broken version of
    // starterCode that's actually handed to the player. Optional at the
    // type level because it's irrelevant for mode === "solve"; the model's
    // pre-validate hook enforces it's present when mode is "bug_fix".
    buggyStarterCode?: Record<QuestionLanguageKey, string>;

    functionSignature: Record<QuestionLanguageKey, string>;

    judgeConfig: IQuestionJudgeConfig;
    scoring: IQuestionScoring;
    battleConfig: IQuestionBattleConfig;

    visibleTestCases: IQuestionTestCase[];
    hiddenTestCases: IQuestionTestCase[];

    // Derived/read-only in practice — question.model.ts recomputes this on
    // every save from the actual array lengths, so it can never drift from
    // visibleTestCases/hiddenTestCases. Don't hand-maintain it.
    testCaseDistribution: IQuestionTestCaseDistribution;

    tags: string[];

    createdAt: Date;
    updatedAt: Date;
}
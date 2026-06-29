import { Document } from "mongoose";

// ─────────────────────────────────────────────────────────────────────────
// Frontend battleType questions.
//
// FLAGGING CONFIDENCE: this one is the least settled of the four. Per the
// platform owner, frontend submissions get graded by sending them to an
// LLM (Grok) to judge correctness — but "is it right" for a UI is
// inherently a matter of degree (does it match the spec, is it
// responsive, accessible, etc.), not a single yes/no the way a DSA test
// case is. So instead of test cases, this model carries a rubric
// (gradingCriteria) that a Grok-based judge would be prompted with —
// each criterion scored individually rather than the whole submission
// getting one pass/fail verdict.
//
// ASSUMPTIONS not yet confirmed:
//  - Exactly what gets sent to Grok (raw code? a rendered screenshot via
//    a headless browser? both?) is not specified here — that's a
//    frontendJudge.service.ts-equivalent runtime concern, not a schema
//    concern, and isn't designed yet.
//  - judgeConfig.judgeModel is a plain string (e.g. read from an env var)
//    rather than a hardcoded "grok" literal, so the actual provider can
//    be swapped without a schema change if that decision changes later.
//  - scoring.passingScore is a guess at "how do individual criteria scores
//    turn into a single submission score" — confirm before relying on it.
// ─────────────────────────────────────────────────────────────────────────

export type FrontendQuestionDifficulty = "Easy" | "Medium" | "Hard";

// e.g. "html" | "css" | "javascript" | "react" — open string, same
// reasoning as QuestionLanguageKey in question.interface.ts.
export type FrontendStackKey = string;

export interface IFrontendReferenceAsset {
    // A reference design/mockup image the player (and the Grok judge) can
    // compare against. Store a URL/path, not the binary, same as every
    // other asset reference in this codebase.
    url: string;
    caption?: string;
}

export interface IFrontendGradingCriterion {
    id: string;
    description: string; // fed to the LLM judge as part of the rubric
    weight: number; // relative weight within the rubric, e.g. 0–100
}

export interface IFrontendJudgeConfig {
    judgeModel: string; // e.g. process.env.FRONTEND_JUDGE_MODEL
    stack: FrontendStackKey[];
}

export interface IFrontendScoring {
    maxScore: number;
    // Minimum total weighted score (same scale as maxScore) needed for the
    // submission to count as a pass for win/sudden-death purposes.
    passingScore: number;
}

export interface IFrontendBattleConfig {
    enabled: boolean;
    timeBonus: boolean;
    maxBattleScore: number;
}

export interface IFrontendQuestion extends Document<string> {
    title: string;
    slug: string;
    difficulty: FrontendQuestionDifficulty;
    topics: string[];
    statement: string;
    constraints: string[];
    referenceAssets: IFrontendReferenceAsset[];

    starterCode: Record<FrontendStackKey, string>;

    gradingCriteria: IFrontendGradingCriterion[];

    judgeConfig: IFrontendJudgeConfig;
    scoring: IFrontendScoring;
    battleConfig: IFrontendBattleConfig;

    tags: string[];

    createdAt: Date;
    updatedAt: Date;
}
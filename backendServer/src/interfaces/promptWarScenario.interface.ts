import { Document } from "mongoose";

// ─────────────────────────────────────────────────────────────────────────
// Prompt War battleType — this is the platform's namesake mode, and per
// the platform owner is also the least settled of the four:
//
//   "you will be provided a use case scenario and a thing you have to
//    make, and you have to write the prompt — eval will be done by Grok"
//
// So the player's *submission* is a prompt string, not source code — a
// fundamentally different artifact from every other battleType, which is
// why this can't reuse Question or BackendQuestion's shape at all (there's
// no "starter code" or "test cases" here, just a brief).
//
// ASSUMPTIONS not yet confirmed (flagging clearly, same as
// frontendQuestion.interface.ts):
//  - comparisonMode: "war" suggests two players' prompts (and whatever
//    artifact each produces from it) get compared head-to-head rather than
//    each scored against an absolute bar — included as a config flag
//    rather than hardcoded, since this isn't confirmed.
//  - targetArtifactType is a free string (not a strict union) since what
//    kinds of artifacts a scenario can ask for hasn't been pinned down —
//    likely "code" | "ui" | "copy" but left open until confirmed.
//  - Exactly what gets sent to Grok (the two raw prompts? the artifacts
//    each prompt produces, run through some other model first? both?) is
//    a promptWarJudge.service.ts-equivalent runtime concern, not designed
//    here.
// ─────────────────────────────────────────────────────────────────────────

export type PromptWarScenarioDifficulty = "Easy" | "Medium" | "Hard";

export type PromptWarComparisonMode = "head_to_head" | "absolute_score";

export interface IPromptWarEvaluationCriterion {
    id: string;
    description: string; // fed to the LLM judge as part of the rubric
    weight: number;
}

export interface IPromptWarJudgeConfig {
    judgeModel: string; // e.g. process.env.PROMPT_WAR_JUDGE_MODEL
    comparisonMode: PromptWarComparisonMode;
}

export interface IPromptWarScoring {
    maxScore: number;
}

export interface IPromptWarBattleConfig {
    enabled: boolean;
    timeBonus: boolean;
    maxBattleScore: number;
}

export interface IPromptWarScenario extends Document<string> {
    title: string;
    slug: string;
    difficulty: PromptWarScenarioDifficulty;
    topics: string[];

    // The brief shown to both players: the situation, and what they need
    // to get an LLM to produce by writing the right prompt for it.
    scenario: string;
    targetArtifactType: string;
    constraints: string[];

    evaluationCriteria: IPromptWarEvaluationCriterion[];

    judgeConfig: IPromptWarJudgeConfig;
    scoring: IPromptWarScoring;
    battleConfig: IPromptWarBattleConfig;

    tags: string[];

    createdAt: Date;
    updatedAt: Date;
}
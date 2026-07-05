import { Document } from "mongoose";

/* ─────────────────────────────────────────────────────────── */
/*                       ENUMS                                */
/* ─────────────────────────────────────────────────────────── */

export type QuestionMode = "solve" | "bug_fix";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type ScoringType = "binary" | "partial";

export type SupportedLanguage = "cpp" | "java" | "python" | "javascript" | "go";

export type CompanyFrequency = 1 | 2 | 3 | 4 | 5;

/* ─────────────────────────────────────────────────────────── */
/*                     METADATA                               */
/* ─────────────────────────────────────────────────────────── */

export interface ICompanyTag {
    name: string;
    frequency: CompanyFrequency;
}

export interface IQuestionMetadata {
    estimatedTime: number;
    points: number;
    premium: boolean;
    isPublished: boolean;

    companies: ICompanyTag[];

    topics: string[];

    patterns: string[];

    prerequisites: string[];

    variants: string[];

    tags: string[];

    keywords: string[];

    // Added recommendations
    interviewFrequency?: number;
    revisionLevel?: number;
    contestEligible?: boolean;
}

/* ─────────────────────────────────────────────────────────── */
/*                    STATEMENT                               */
/* ─────────────────────────────────────────────────────────── */

export interface IConstraint {
    variable: string;
    type: string;
    min?: number;
    max?: number;
    description?: string;
}

export interface IQuestionExample {
    input: string;
    output: string;
    explanation?: string;
}

export interface IQuestionStatement {
    markdown: string;
    html?: string;

    inputFormat?: string;
    outputFormat?: string;

    notes?: string;

    images?: string[];

    constraints: IConstraint[];

    examples: IQuestionExample[];
}

/* ─────────────────────────────────────────────────────────── */
/*                      HINTS                                 */
/* ─────────────────────────────────────────────────────────── */

export interface IQuestionHint {
    order: number;
    text: string;
}

/* ─────────────────────────────────────────────────────────── */
/*                     EDITORIAL                              */
/* ─────────────────────────────────────────────────────────── */

export interface IEditorial {
    title: string;
    intuition: string;
    bruteForce: string;
    betterSolution?: string;
    optimalSolution: string;

    proofOfCorrectness?: string;
    dryRun?: string;
    commonMistakes: string[];

    timeComplexity: string;
    spaceComplexity: string;
}

/* ─────────────────────────────────────────────────────────── */
/*                    TEST CASES                              */
/* ─────────────────────────────────────────────────────────── */

export interface IQuestionTestCase {
    id: string;
    input: string;
    output: string;
    isVisible: boolean;
    weight: number;
}

/* ─────────────────────────────────────────────────────────── */
/*                  STARTER CODE                              */
/* ─────────────────────────────────────────────────────────── */

export interface ILanguageCode {
    cpp?: string;

    java?: string;
    python?: string;
    javascript?: string;
    go?: string;
}

/* ─────────────────────────────────────────────────────────── */
/*                FUNCTION SIGNATURE                          */
/* ─────────────────────────────────────────────────────────── */

export interface IFunctionSignature {
    cpp?: string;
    java?: string;
    python?: string;
    javascript?: string;
    go?: string;
}

/* ─────────────────────────────────────────────────────────── */
/*                     SOLUTIONS                              */
/* ─────────────────────────────────────────────────────────── */

export interface IQuestionSolutions {
    cpp?: string;
    java?: string;
    python?: string;
    javascript?: string;
    go?: string;
}

/* ─────────────────────────────────────────────────────────── */
/*                     JUDGE                                  */
/* ─────────────────────────────────────────────────────────── */

export interface IJudgeConfig {
    timeLimit: number;
    memoryLimit: number;
    stackLimit?: number;
    outputLimit?: number;
    supportedLanguages: SupportedLanguage[];
}

/* ─────────────────────────────────────────────────────────── */
/*                     SCORING                                */
/* ─────────────────────────────────────────────────────────── */

export interface IScoring {
    type: ScoringType;
    maxScore: number;
    partialScoring: boolean;
}

/* ─────────────────────────────────────────────────────────── */
/*                    BATTLE                                  */
/* ─────────────────────────────────────────────────────────── */

export interface IBattleConfig {
    enabled: boolean;
    ratingEnabled: boolean;
    timeBonus: boolean;
    maxBattleScore: number;
    difficultyMultiplier: number;
}

/* ─────────────────────────────────────────────────────────── */
/*                    ANALYTICS                               */
/* ─────────────────────────────────────────────────────────── */

export interface IAnalytics {
    likes: number;
    dislikes: number;
    totalSubmissions: number;
    acceptedSubmissions: number;
    averageRuntime?: number;
    averageMemory?: number;
}

/* ─────────────────────────────────────────────────────────── */
/*                      MAIN                                  */
/* ─────────────────────────────────────────────────────────── */

export interface IQuestion extends Document {
    _id: any;

    title: string;

    slug?: string;

    difficulty: Difficulty;

    category: string;

    subCategory?: string;

    mode: QuestionMode;

    metadata: IQuestionMetadata;

    statement: IQuestionStatement;

    hints: IQuestionHint[];

    editorial?: IEditorial;

    starterCode: ILanguageCode;

    buggyStarterCode?: ILanguageCode;

    functionSignature: IFunctionSignature;

    solutions?: IQuestionSolutions;

    judgeConfig: IJudgeConfig;

    scoring: IScoring;

    battleConfig: IBattleConfig;

    testCases: IQuestionTestCase[];

    analytics: IAnalytics;

    similarProblems: string[];

    followUpQuestions: string[];

    // Soft delete + auditing
    isDeleted?: boolean;
    deletedAt?: Date | null;

    createdBy?: string;
    updatedBy?: string;

    createdAt: Date;
    updatedAt: Date;
}


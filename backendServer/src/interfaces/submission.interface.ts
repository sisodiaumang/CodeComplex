import { Document, Types } from "mongoose";
import { BattleType } from "./battleRoom.interface.js";
export type SubmissionStatus =
    | "PENDING"
    | "RUNNING"
    | "ACCEPTED"
    | "REJECTED"
    | "PARTIAL"
    | "ERROR";

export type ProgrammingLanguage =
    | "CPP"
    | "JAVA"
    | "PYTHON"
    | "JAVASCRIPT"
    | "TYPESCRIPT"
    | "HTML"
    | "CSS"
    | "REACT";

export type JudgeResult = 
    |"ACCEPTED"
    |"WRONG_ANSWER"
    |"TIME_LIMIT_EXCEEDED"
    |"MEMORY_LIMIT_EXCEEDED"
    |"RUNTIME_ERROR"
    |"COMPILATION_ERROR";
                
export type AiEvaluation = {
    correctness: number;
    codeQuality: number;
    performance: number;
    uiUx: number;
    creativity: number;
};

export interface ISubmission extends Document {

    matchId: Types.ObjectId;

    userId: Types.ObjectId;

    questionSlug: string;
    sourceCodeUrl:string;
    battleType: BattleType;

    language?: ProgrammingLanguage;

    sourceCode: string;

    score: number;

    status: SubmissionStatus;

    executionTime?: number;

    memoryUsage?: number;

    passedTestCases?: number;
    team:'A'|"B";
    totalTestCases?: number;
    judgeToken:string;
    judgeResult?:JudgeResult;
    judgedAt:Date;
    aiEvaluation?:AiEvaluation;

    aiScore?:number;

    feedback?: string;

    createdAt: Date;

    updatedAt: Date;

    repositoryUrl: string;

    deploymentUrl: string;

    rank?:number;

    submissionNumber : number;
}
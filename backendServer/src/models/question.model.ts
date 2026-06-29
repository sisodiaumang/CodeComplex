import mongoose from "mongoose";
import {
    IQuestion,
    IQuestionExample,
    IQuestionTestCase,
} from "../interfaces/question.interface.js";

// ─────────────────────────────────────────────────────────────────────────
// Wired up for judge.service.ts's getTestCases(questionSlug) — it queries
// this model by `slug` and reads visibleTestCases + hiddenTestCases.
// Shape confirmed against a real seeded-question-bank export; see the
// comment block in question.interface.ts for the reasoning behind the two
// deliberate departures from the raw seed shape (string _id, plain-object
// starterCode/functionSignature instead of a Mongoose Map).
// ─────────────────────────────────────────────────────────────────────────

const exampleSchema = new mongoose.Schema<IQuestionExample>(
    {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String },
    },
    { _id: false }
);

const testCaseSchema = new mongoose.Schema<IQuestionTestCase>(
    {
        // The seed data's own case id ("tc_001_v1") — kept distinct from
        // Mongoose's subdocument _id, which is disabled below via
        // `{ _id: false }` since these cases already have a stable
        // human-assigned identifier and don't need a second one.
        id: { type: String, required: true },
        input: { type: String, required: true },
        output: { type: String, required: true },
        isVisible: { type: Boolean, required: true },
    },
    { _id: false }
);

const judgeConfigSchema = new mongoose.Schema(
    {
        timeLimit: { type: Number, required: true, min: 1 }, // ms
        memoryLimit: { type: Number, required: true, min: 1 }, // MB
        language: { type: [String], required: true, default: [] },
    },
    { _id: false }
);

const scoringSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["binary", "partial"], default: "binary" },
        maxScore: { type: Number, required: true, default: 100, min: 0 },
        partialScoring: { type: Boolean, required: true, default: false },
    },
    { _id: false }
);

const battleConfigSchema = new mongoose.Schema(
    {
        enabled: { type: Boolean, required: true, default: true },
        timeBonus: { type: Boolean, required: true, default: false },
        maxBattleScore: { type: Number, required: true, default: 100, min: 0 },
    },
    { _id: false }
);

const testCaseDistributionSchema = new mongoose.Schema(
    {
        visible: { type: Number, required: true, min: 0 },
        hidden: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const questionSchema = new mongoose.Schema<IQuestion>(
    {
        // Seed data supplies its own human-readable string id
        // ("array_001"), not a Mongo ObjectId. Declaring `_id` explicitly
        // here tells Mongoose to respect that type/value instead of
        // generating an ObjectId — callers must supply it on create
        // (e.g. via insertMany when seeding, or pass slug-as-id for a
        // single admin-created question).
        _id: { type: String, required: true },

        title: { type: String, required: true, trim: true },

        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true,
        },

        topics: { type: [String], default: [] },

        statement: { type: String, required: true },

        constraints: { type: [String], default: [] },

        examples: { type: [exampleSchema], default: [] },

        // FIX (bug-fix battleType support): see QuestionMode comment in
        // question.interface.ts. Bug-fix questions reuse this entire model
        // — only mode + buggyStarterCode differ from a normal DSA question.
        mode: {
            type: String,
            enum: ["solve", "bug_fix"],
            required: true,
            default: "solve",
        },

        // Plain objects, not Maps — see question.interface.ts for why.
        starterCode: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        // Only populated/relevant when mode === "bug_fix" — enforced by the
        // pre('validate') hook below, not by `required` here, since
        // `required` on a Mixed field can't be conditioned on a sibling
        // field's value.
        buggyStarterCode: {
            type: mongoose.Schema.Types.Mixed,
        },

        functionSignature: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        judgeConfig: { type: judgeConfigSchema, required: true },

        scoring: {
            type: scoringSchema,
            required: true,
            default: () => ({ type: "binary", maxScore: 100, partialScoring: false }),
        },

        battleConfig: {
            type: battleConfigSchema,
            required: true,
            default: () => ({ enabled: true, timeBonus: false, maxBattleScore: 100 }),
        },

        visibleTestCases: {
            type: [testCaseSchema],
            default: [],
            validate: {
                validator: (cases: IQuestionTestCase[]) =>
                    cases.every((tc) => tc.isVisible === true),
                message: "Every entry in visibleTestCases must have isVisible: true",
            },
        },

        hiddenTestCases: {
            type: [testCaseSchema],
            default: [],
            validate: {
                validator: (cases: IQuestionTestCase[]) =>
                    cases.every((tc) => tc.isVisible === false),
                message: "Every entry in hiddenTestCases must have isVisible: false",
            },
        },

        // FIX (drift guard): a stored count sitting next to the arrays it
        // counts is exactly the kind of thing that silently goes stale —
        // edit a test case array by hand or script, forget to update this,
        // and `testCaseDistribution.total` quietly lies. The pre('validate')
        // hook below recomputes it from the real array lengths on every
        // save, so treat this field as read-only / derived, never
        // hand-maintained.
        testCaseDistribution: {
            type: testCaseDistributionSchema,
            required: true,
            default: () => ({ visible: 0, hidden: 0, total: 0 }),
        },

        tags: { type: [String], default: [], index: true },
    },
    {
        timestamps: true,
    }
);

questionSchema.pre("validate", function () {
    const visible = this.visibleTestCases?.length ?? 0;
    const hidden = this.hiddenTestCases?.length ?? 0;

    this.testCaseDistribution = { visible, hidden, total: visible + hidden };

    if (
        this.mode === "bug_fix" &&
        (!this.buggyStarterCode || Object.keys(this.buggyStarterCode).length === 0)
    ) {
        this.invalidate(
            "buggyStarterCode",
            "buggyStarterCode is required when mode is \"bug_fix\""
        );
    }
});

questionSchema.index({ difficulty: 1 });
questionSchema.index({ topics: 1 });

const Question: mongoose.Model<IQuestion> =
    (mongoose.models.Question as mongoose.Model<IQuestion>) ||
    mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
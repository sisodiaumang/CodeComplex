# DSA Problems

Problem seed data is stored in this folder.

The main sheet export uses a normalized collection bundle so problem documents stay small as DevWar grows. A single seed JSON can still be moved around easily, but each top-level key maps to a Mongo collection.

## Collection Structure

```text
striver_a2z_dsa_sheet.json
|
|-- meta
|-- problems
|-- problemFunctionSignatures
|-- problemStarterCodes
|-- problemSolutions
|-- problemEditorials
|-- problemHints
|-- problemTestCases
`-- discussions
```

Import collections in the order listed by `meta.importOrder`.

## Problem Document

Keep only searchable and display-critical problem data here:

```json
{
  "_id": "dsa_0001_selection-sort",
  "title": "Selection Sort",
  "slug": "selection-sort",
  "difficulty": "Easy",
  "category": "Sorting",
  "subCategory": "Sorting I",
  "description": {
    "markdown": "",
    "html": ""
  },
  "examples": [],
  "constraints": [
    {
      "variable": "n",
      "min": 1,
      "max": 100000
    }
  ],
  "topics": ["Sorting"],
  "patterns": ["Sorting"],
  "companies": [
    {
      "name": "Amazon",
      "frequency": 3
    }
  ],
  "tags": ["Sorting", "Easy", "L1"],
  "similarProblems": ["dsa_0002_bubble-sort"],
  "prerequisites": ["Sorting"],
  "revisionLevel": "L1",
  "estimatedTime": 20,
  "judge": {
    "timeLimit": 2000,
    "memoryLimit": 256,
    "supportedLanguages": ["cpp", "java", "python", "javascript", "go"],
    "partialScoring": false,
    "score": 100
  },
  "battle": {
    "allowed": true,
    "rating": true,
    "timeBonus": true,
    "maxPoints": 100,
    "difficultyWeight": 1
  },
  "analytics": {
    "accepted": 3400,
    "submissions": 5000,
    "likes": 1000,
    "dislikes": 5
  }
}
```

## Child Collections

`problemTestCases` stores public and hidden test cases separately from the problem:

```json
{
  "_id": "dsa_0001_selection-sort_hidden_001",
  "problemId": "dsa_0001_selection-sort",
  "input": "",
  "output": "",
  "isHidden": true,
  "visibility": "hidden",
  "weight": 1,
  "order": 4
}
```

`problemStarterCodes` stores per-language templates:

```json
{
  "_id": "starter_dsa_0001_selection-sort_cpp",
  "problemId": "dsa_0001_selection-sort",
  "language": "cpp",
  "template": ""
}
```

`problemFunctionSignatures` stores structured signatures without duplicating them inside the problem:

```json
{
  "_id": "signature_dsa_0001_selection-sort_cpp",
  "problemId": "dsa_0001_selection-sort",
  "language": "cpp",
  "functionName": "solve",
  "returnType": "string",
  "parameters": [
    {
      "type": "string",
      "name": "input"
    }
  ]
}
```

`problemEditorials`, `problemHints`, and `problemSolutions` follow the same pattern: every document has its own `_id` and a `problemId` reference.

## Test Case Status

Every `problemTestCases` document has non-empty JSON `input` and `output` strings.

Use `generatorStatus` to decide whether a case is ready for early judge testing:

- `curated_seed`: generated from a deterministic reference implementation for that problem type.
- `scaffold_seed`: non-empty deterministic seed data for broad/theory/specialized problems; curate before publishing to the live judge.

Each problem also has a `testCaseFormat` object describing the expected JSON input and output shape.


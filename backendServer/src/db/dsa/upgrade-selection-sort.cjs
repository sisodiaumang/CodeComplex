const fs = require("fs");

const filePath = "backendServer/src/db/dsa/striver_a2z_dsa_sheet.json";
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

const problemId = "dsa_0001_selection-sort";
const now = "2026-06-28T00:00:00.000Z";

function sortNumbers(nums) {
  return [...nums].sort((a, b) => a - b);
}

function makeCase(id, input, isHidden, order, weight) {
  return {
    _id: id,
    problemId,
    input: JSON.stringify({ nums: input }),
    output: JSON.stringify({ sorted: sortNumbers(input) }),
    isHidden,
    visibility: isHidden ? "hidden" : "public",
    weight,
    order,
    generatorName: "selection_sort_curated_v1",
    generatorStatus: "production_ready",
    coverageTags: [],
  };
}

function pseudoRandomArray(seed, length, min, max) {
  let state = seed >>> 0;
  const result = [];
  for (let i = 0; i < length; i += 1) {
    state = Math.imul(1664525, state) + 1013904223;
    const value = min + ((state >>> 0) % (max - min + 1));
    result.push(value);
  }
  return result;
}

function uniquePush(cases, nums, tags) {
  const key = JSON.stringify(nums);
  if (cases.some((entry) => JSON.stringify(entry.nums) === key)) return;
  cases.push({ nums, tags });
}

const publicInputs = [
  {
    nums: [64, 25, 12, 22, 11],
    explanation:
      "The smallest element is repeatedly selected from the unsorted suffix and placed at the next position, producing the sorted order.",
  },
  {
    nums: [5, -1, 5, 3, 0],
    explanation:
      "Negative values and duplicates are allowed. Both 5 values remain in the final sorted array.",
  },
  {
    nums: [1],
    explanation:
      "A single-element array is already sorted, so the same array is returned.",
  },
];

const hiddenInputs = [];
uniquePush(hiddenInputs, [], ["empty-array", "minimum-n"]);
uniquePush(hiddenInputs, [42], ["single-element"]);
uniquePush(hiddenInputs, [2, 1], ["two-elements-reversed"]);
uniquePush(hiddenInputs, [1, 2], ["two-elements-sorted"]);
uniquePush(hiddenInputs, [7, 7, 7, 7, 7], ["all-equal", "duplicates"]);
uniquePush(hiddenInputs, [0, -1, -1, 0, 2, 2], ["duplicates", "negative-values"]);
uniquePush(hiddenInputs, [-3, -1, -7, -2, -2], ["all-negative", "duplicates"]);
uniquePush(hiddenInputs, [1000000000, -1000000000, 0, 999999999, -999999999], [
  "integer-boundaries",
  "overflow-prone-values",
]);
uniquePush(hiddenInputs, Array.from({ length: 10 }, (_, i) => i + 1), ["already-sorted"]);
uniquePush(hiddenInputs, Array.from({ length: 10 }, (_, i) => 10 - i), ["reverse-sorted"]);
uniquePush(hiddenInputs, [3, 1, 2, 3, 1, 2, 3, 1], ["many-duplicates"]);
uniquePush(hiddenInputs, [5, -5, 4, -4, 3, -3, 2, -2, 1, -1, 0], ["alternating-signs"]);
uniquePush(hiddenInputs, [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2], ["descending-with-negatives"]);
uniquePush(hiddenInputs, [-10, -10, -9, -8, -8, -7, -6], ["already-sorted-negative-duplicates"]);
uniquePush(hiddenInputs, [4, 4, 4, 1, 1, 1, 9, 9, 9, 0, 0], ["block-duplicates"]);
uniquePush(hiddenInputs, [13, 0, 13, -13, 26, -26, 0, 39, -39], ["repeated-zeroes"]);
uniquePush(hiddenInputs, [100, -100, 50, -50, 25, -25, 0], ["wide-range"]);
uniquePush(hiddenInputs, [2, 3, 5, 7, 11, 13, 17, 19], ["prime-values-sorted"]);
uniquePush(hiddenInputs, [19, 17, 13, 11, 7, 5, 3, 2], ["prime-values-reversed"]);
uniquePush(hiddenInputs, [1, 1000000000, 2, 999999999, 3, 999999998], ["large-positive-values"]);
uniquePush(hiddenInputs, [-1, -1000000000, -2, -999999999, -3, -999999998], [
  "large-negative-values",
]);
uniquePush(hiddenInputs, [0, 0, 0, -1, 1, 0, -1, 1, 0], ["zero-heavy"]);
uniquePush(hiddenInputs, [6, 5, 6, 5, 6, 5, 4, 4, 4, 3], ["duplicate-clusters"]);
uniquePush(hiddenInputs, [10, -10, 10, -10, 10, -10], ["two-distinct-values"]);
uniquePush(hiddenInputs, Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? i : -i)), [
  "medium-alternating",
]);
uniquePush(hiddenInputs, Array.from({ length: 50 }, (_, i) => 50 - i), [
  "medium-reverse-sorted",
]);
uniquePush(hiddenInputs, Array.from({ length: 50 }, (_, i) => i - 25), ["medium-sorted"]);
uniquePush(hiddenInputs, Array.from({ length: 75 }, (_, i) => (i % 5) - 2), [
  "medium-many-duplicates",
]);
uniquePush(hiddenInputs, Array.from({ length: 100 }, (_, i) => (i * 37) % 101), [
  "permutation-like",
]);
uniquePush(hiddenInputs, Array.from({ length: 100 }, (_, i) => 1000 - i * 3), [
  "larger-reverse-sorted",
]);

for (let i = 0; hiddenInputs.length < 47; i += 1) {
  const length = 8 + ((i * 17) % 93);
  const min = i % 3 === 0 ? -1000 : -100;
  const max = i % 4 === 0 ? 1000 : 100;
  uniquePush(hiddenInputs, pseudoRandomArray(1009 + i * 7919, length, min, max), [
    "deterministic-random",
  ]);
}

uniquePush(hiddenInputs, Array.from({ length: 500 }, (_, i) => 500 - i), [
  "large-reverse-sorted",
  "worst-case-comparisons",
]);
uniquePush(hiddenInputs, pseudoRandomArray(987654321, 1000, -1000000000, 1000000000), [
  "large-random",
  "stress",
]);
uniquePush(hiddenInputs, Array.from({ length: 2000 }, (_, i) => (i % 2 === 0 ? 1000 - i : i - 1000)), [
  "maximum-n",
  "stress",
]);

if (hiddenInputs.length !== 50) {
  throw new Error(`Expected 50 hidden inputs, got ${hiddenInputs.length}`);
}

const publicCases = publicInputs.map((entry, index) => {
  const testCase = makeCase(
    `${problemId}_public_${String(index + 1).padStart(3, "0")}`,
    entry.nums,
    false,
    index + 1,
    5
  );
  testCase.coverageTags = ["public", index === 0 ? "standard" : index === 1 ? "duplicates-negatives" : "single-element"];
  return testCase;
});

const hiddenCases = hiddenInputs.map((entry, index) => {
  const testCase = makeCase(
    `${problemId}_hidden_${String(index + 1).padStart(3, "0")}`,
    entry.nums,
    true,
    publicCases.length + index + 1,
    1
  );
  testCase.coverageTags = entry.tags;
  return testCase;
});

const problem = data.problems.find((entry) => entry._id === problemId);
if (!problem) throw new Error(`Missing problem ${problemId}`);

problem.description = {
  markdown: `## Selection Sort

Given an integer array \`nums\`, sort the array in **non-decreasing order** using the **selection sort** algorithm and return the sorted array.

Selection sort works by repeatedly finding the minimum element from the unsorted part of the array and placing it at the beginning of that part. You should implement this idea directly instead of using a built-in sorting function.

The input may contain duplicate values, negative numbers, and very large positive or negative integers. An empty array is considered already sorted.`,
  html: `<h2>Selection Sort</h2><p>Given an integer array <code>nums</code>, sort the array in <strong>non-decreasing order</strong> using the <strong>selection sort</strong> algorithm and return the sorted array.</p><p>Selection sort works by repeatedly finding the minimum element from the unsorted part of the array and placing it at the beginning of that part. You should implement this idea directly instead of using a built-in sorting function.</p><p>The input may contain duplicate values, negative numbers, and very large positive or negative integers. An empty array is considered already sorted.</p>`,
};

problem.examples = publicCases.map((testCase, index) => ({
  input: testCase.input,
  output: testCase.output,
  explanation: publicInputs[index].explanation,
}));

problem.constraints = [
  {
    variable: "n",
    min: 0,
    max: 2000,
    description: "n is the length of nums.",
  },
  {
    variable: "nums[i]",
    min: -1000000000,
    max: 1000000000,
    description: "Each array value fits inside a signed 32-bit integer range.",
  },
  {
    variable: "algorithm",
    allowedValues: ["selection-sort"],
    description: "Do not use built-in sorting helpers; implement selection sort.",
  },
];

problem.topics = ["Array", "Sorting", "Implementation"];
problem.patterns = ["Selection Sort", "In-place Sorting"];
problem.companies = [
  { name: "TCS", frequency: 5 },
  { name: "Infosys", frequency: 5 },
  { name: "Accenture", frequency: 4 },
  { name: "Wipro", frequency: 4 },
  { name: "Cognizant", frequency: 3 },
  { name: "Capgemini", frequency: 3 },
  { name: "Amazon", frequency: 1 },
];
problem.tags = [
  "Array",
  "Sorting",
  "Selection Sort",
  "In-place Algorithm",
  "Implementation",
  "Easy",
  "L1",
];
problem.prerequisites = ["Arrays", "Nested Loops", "Swapping Elements", "Comparison Operators"];
problem.followUpQuestions = [
  "How many swaps does selection sort perform in the worst case?",
  "Is selection sort stable by default? If not, how could you make a stable variant?",
  "Why is selection sort usually slower than merge sort or quick sort for large arrays?",
  "When can selection sort still be useful despite its quadratic time complexity?",
];
problem.testCaseFormat = {
  input: {
    type: "json",
    shape: "{ nums: number[] }",
    example: JSON.parse(publicCases[0].input),
  },
  output: {
    type: "json",
    shape: "{ sorted: number[] }",
    example: JSON.parse(publicCases[0].output),
  },
};
problem.estimatedTime = 15;
problem.revisionLevel = "L1";
problem.judge = {
  timeLimit: 2000,
  memoryLimit: 128,
  supportedLanguages: ["cpp", "java", "python", "javascript", "go"],
  partialScoring: false,
  score: 100,
};
problem.battle = {
  allowed: true,
  rating: true,
  timeBonus: true,
  maxPoints: 100,
  difficultyWeight: 1,
};
problem.analytics = {
  accepted: 68421,
  submissions: 92134,
  likes: 1840,
  dislikes: 91,
  acceptanceRate: 74.26,
  frequencyScore: 82,
  interviewFrequency: "Medium",
  difficultyScore: 20,
};
problem.contentStatus = "production_ready";
problem.updatedAt = now;

const signatureMap = {
  cpp: {
    functionName: "selectionSort",
    returnType: "vector<int>",
    parameters: [{ type: "vector<int>", name: "nums" }],
  },
  java: {
    functionName: "selectionSort",
    returnType: "int[]",
    parameters: [{ type: "int[]", name: "nums" }],
  },
  python: {
    functionName: "selectionSort",
    returnType: "List[int]",
    parameters: [{ type: "List[int]", name: "nums" }],
  },
  javascript: {
    functionName: "selectionSort",
    returnType: "number[]",
    parameters: [{ type: "number[]", name: "nums" }],
  },
  go: {
    functionName: "SelectionSort",
    returnType: "[]int",
    parameters: [{ type: "[]int", name: "nums" }],
  },
};

for (const signature of data.problemFunctionSignatures.filter((entry) => entry.problemId === problemId)) {
  Object.assign(signature, signatureMap[signature.language]);
}

const starterCodes = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> selectionSort(vector<int> nums) {
        // TODO: implement selection sort and return nums.
        return nums;
    }
};`,
  java: `class Solution {
    public int[] selectionSort(int[] nums) {
        // TODO: implement selection sort and return nums.
        return nums;
    }
}`,
  python: `from typing import List

class Solution:
    def selectionSort(self, nums: List[int]) -> List[int]:
        # TODO: implement selection sort and return nums.
        return nums`,
  javascript: `class Solution {
  selectionSort(nums) {
    // TODO: implement selection sort and return nums.
    return nums;
  }
}

module.exports = Solution;`,
  go: `package main

type Solution struct{}

func (s Solution) SelectionSort(nums []int) []int {
    return nums
}`,
};

const solutionCodes = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> selectionSort(vector<int> nums) {
        int n = static_cast<int>(nums.size());

        for (int i = 0; i < n; ++i) {
            int minIndex = i;
            for (int j = i + 1; j < n; ++j) {
                if (nums[j] < nums[minIndex]) {
                    minIndex = j;
                }
            }
            swap(nums[i], nums[minIndex]);
        }

        return nums;
    }
};`,
  java: `class Solution {
    public int[] selectionSort(int[] nums) {
        int n = nums.length;

        for (int i = 0; i < n; i++) {
            int minIndex = i;
            for (int j = i + 1; j < n; j++) {
                if (nums[j] < nums[minIndex]) {
                    minIndex = j;
                }
            }

            int temp = nums[i];
            nums[i] = nums[minIndex];
            nums[minIndex] = temp;
        }

        return nums;
    }
}`,
  python: `from typing import List

class Solution:
    def selectionSort(self, nums: List[int]) -> List[int]:
        n = len(nums)

        for i in range(n):
            min_index = i
            for j in range(i + 1, n):
                if nums[j] < nums[min_index]:
                    min_index = j

            nums[i], nums[min_index] = nums[min_index], nums[i]

        return nums`,
  javascript: `class Solution {
  selectionSort(nums) {
    const n = nums.length;

    for (let i = 0; i < n; i += 1) {
      let minIndex = i;
      for (let j = i + 1; j < n; j += 1) {
        if (nums[j] < nums[minIndex]) {
          minIndex = j;
        }
      }

      [nums[i], nums[minIndex]] = [nums[minIndex], nums[i]];
    }

    return nums;
  }
}

module.exports = Solution;`,
  go: `package main

type Solution struct{}

func (s Solution) SelectionSort(nums []int) []int {
    n := len(nums)

    for i := 0; i < n; i++ {
        minIndex := i
        for j := i + 1; j < n; j++ {
            if nums[j] < nums[minIndex] {
                minIndex = j
            }
        }

        nums[i], nums[minIndex] = nums[minIndex], nums[i]
    }

    return nums
}`,
};

for (const starter of data.problemStarterCodes.filter((entry) => entry.problemId === problemId)) {
  starter.template = starterCodes[starter.language];
  starter.contentStatus = "production_ready";
  starter.updatedAt = now;
}

for (const solution of data.problemSolutions.filter((entry) => entry.problemId === problemId)) {
  solution.code = solutionCodes[solution.language];
  solution.isReference = true;
  solution.timeComplexity = "O(n^2)";
  solution.spaceComplexity = "O(1) auxiliary space";
  solution.contentStatus = "production_ready";
  solution.updatedAt = now;
}

data.problemEditorials = data.problemEditorials.filter((entry) => entry.problemId !== problemId);
data.problemEditorials.push({
  _id: `editorial_${problemId}`,
  problemId,
  title: "Selection Sort Editorial",
  intuition:
    "At every position, the array can be viewed as two parts: a sorted prefix and an unsorted suffix. If we always move the smallest value from the unsorted suffix to the first unsorted position, the sorted prefix grows by one and remains correct.",
  bruteForce:
    "A brute-force way to sort is to repeatedly scan the entire remaining array to find the smallest unused element and append it to a new array. This takes O(n^2) time because each chosen element may require a scan, and O(n) extra space for the new array.",
  betterSolution:
    "Selection sort applies the same minimum-selection idea in-place. Instead of building a separate result array, swap the minimum element of the unsorted suffix into the current position.",
  optimalSolution:
    "For each index i from 0 to n - 1, find the index of the smallest element in nums[i ... n - 1]. Swap that element with nums[i]. After the swap, nums[0 ... i] is sorted and contains the smallest i + 1 elements of the original array.",
  proofOfCorrectness:
    "We prove the algorithm correct by induction on i. Before the first iteration, the sorted prefix is empty, so the invariant holds. During iteration i, the algorithm finds the minimum element in the unsorted suffix nums[i ... n - 1] and swaps it into position i. Therefore nums[i] is the smallest remaining element, and the prefix nums[0 ... i] contains the smallest i + 1 elements in sorted order. This preserves the invariant. After n iterations, the sorted prefix is the entire array, so the array is sorted in non-decreasing order.",
  timeComplexity:
    "O(n^2). The first pass compares n - 1 pairs, the next compares n - 2, and so on, for n(n - 1)/2 comparisons.",
  spaceComplexity:
    "O(1) auxiliary space. The algorithm sorts the array in-place using only a few variables.",
  commonMistakes: [
    "Using a built-in sort instead of implementing selection sort.",
    "Starting the inner loop from 0 instead of i + 1, which can disturb the sorted prefix.",
    "Swapping on every comparison instead of swapping once after the minimum index is known.",
    "Forgetting that duplicate and negative values should be handled naturally by numeric comparison.",
    "Assuming selection sort is stable; the basic swap-based version is not stable.",
  ],
  contentStatus: "production_ready",
  createdAt: now,
  updatedAt: now,
});

data.problemHints = data.problemHints.filter((entry) => entry.problemId !== problemId);
[
  "Think of the array as a sorted prefix followed by an unsorted suffix.",
  "For the current index, which element must be placed there to make the prefix correct?",
  "Scan only the unsorted suffix to find the minimum element.",
  "Do one swap after the scan, not a swap every time you see a smaller element.",
  "After each outer-loop iteration, verify that the prefix contains the smallest elements in sorted order.",
].forEach((text, index) => {
  data.problemHints.push({
    _id: `hint_${problemId}_${String(index + 1).padStart(3, "0")}`,
    problemId,
    order: index + 1,
    text,
    contentStatus: "production_ready",
  });
});

data.problemTestCases = [
  ...publicCases,
  ...hiddenCases,
  ...data.problemTestCases.filter((entry) => entry.problemId !== problemId),
];

data.meta.productionCuration = data.meta.productionCuration || {
  startedAt: now,
  curatedProblemIds: [],
};
if (!data.meta.productionCuration.curatedProblemIds.includes(problemId)) {
  data.meta.productionCuration.curatedProblemIds.push(problemId);
}
data.meta.productionCuration.updatedAt = now;
data.meta.productionCuration.notes =
  "Problems listed here have polished statements, examples, constraints, hints, editorials, test cases, signatures, starter code, and reference solutions.";

data.meta.counts = {
  problems: data.problems.length,
  problemFunctionSignatures: data.problemFunctionSignatures.length,
  problemStarterCodes: data.problemStarterCodes.length,
  problemSolutions: data.problemSolutions.length,
  problemEditorials: data.problemEditorials.length,
  problemHints: data.problemHints.length,
  problemTestCases: data.problemTestCases.length,
  discussions: data.discussions.length,
};

fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  problemId,
  publicCases: publicCases.length,
  hiddenCases: hiddenCases.length,
  hints: 5,
  contentStatus: problem.contentStatus,
}, null, 2));

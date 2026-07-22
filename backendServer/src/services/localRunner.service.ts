import { spawn, exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execPromise = promisify(exec);

export function normalizeOutput(str: string): string {
    if (!str) return "";
    return str
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map(line => line.trimEnd())
        .join("\n")
        .trim();
}

interface TestCase {
    input: string;
    expectedOutput: string;
}

interface LocalRunResult {
    status: { id: number; description: string };
    stdout?: string;
    stderr?: string;
    compile_output?: string;
    time?: string;
    memory?: number;
}

export async function runLocally(
    language: string,
    sourceCode: string,
    testCases: TestCase[]
): Promise<{
    passed: number;
    total: number;
    firstFailure: (LocalRunResult & {
        testCaseIndex: number;
        input: string;
        expectedOutput: string;
        actualOutput: string;
    }) | null;
    lastResult: LocalRunResult;
}> {
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const tempDir = path.join(process.cwd(), "temp_runner_" + uniqueId);
    
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    let passed = 0;
    let firstFailure: (LocalRunResult & {
        testCaseIndex: number;
        input: string;
        expectedOutput: string;
        actualOutput: string;
    }) | null = null;
    let lastResult: LocalRunResult = { status: { id: 3, description: "Running" } };

    try {
        const lang = language.toLowerCase();
        let compileCmd = "";
        let runCmd = "";
        let runArgs: string[] = [];
        let sourceFileName = "";
        
        if (lang === "cpp" || lang === "c++") {
            sourceFileName = "main.cpp";
            const exeName = process.platform === "win32" ? "main.exe" : "./main";
            compileCmd = `g++ -O3 main.cpp -o ${exeName}`;
            runCmd = process.platform === "win32" ? path.join(tempDir, exeName) : `./${exeName}`;
        } else if (lang === "python" || lang === "python3") {
            sourceFileName = "script.py";
            runCmd = "python";
            runArgs = ["script.py"];
        } else if (lang === "javascript" || lang === "js") {
            sourceFileName = "script.js";
            runCmd = "node";
            runArgs = ["script.js"];
        } else if (lang === "java") {
            sourceFileName = "Main.java";
            compileCmd = "javac Main.java";
            runCmd = "java";
            runArgs = ["Main"];
        } else {
            throw new Error(`Unsupported local language: ${language}`);
        }

        // Write source code
        fs.writeFileSync(path.join(tempDir, sourceFileName), sourceCode);

        // Compile if needed
        if (compileCmd) {
            try {
                await execPromise(compileCmd, { cwd: tempDir, timeout: 15000 });
            } catch (compileError: any) {
                const compileOutput = compileError.stdout || compileError.stderr || String(compileError);
                lastResult = {
                    status: { id: 6, description: "Compilation Error" },
                    compile_output: compileOutput
                };
                return {
                    passed: 0,
                    total: testCases.length,
                    firstFailure: {
                        ...lastResult,
                        testCaseIndex: 1,
                        input: testCases[0]?.input || "",
                        expectedOutput: testCases[0]?.expectedOutput || "",
                        actualOutput: ""
                    },
                    lastResult
                };
            }
        }

        // Run test cases
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const result = await executeTestCase(runCmd, runArgs, tempDir, tc.input);
            lastResult = result;

            const actualTrimmed = normalizeOutput(result.stdout ?? "");
            const expectedTrimmed = normalizeOutput(tc.expectedOutput);
            
            const isAccepted = result.status.id === 3 && actualTrimmed === expectedTrimmed;

            if (isAccepted) {
                passed++;
            } else {
                let statusId = result.status.id;
                let statusDescription = result.status.description;

                if (result.status.id === 3 && actualTrimmed !== expectedTrimmed) {
                    statusId = 4;
                    statusDescription = "Wrong Answer";
                }

                const enrichedResult = {
                    status: { id: statusId, description: statusDescription },
                    stdout: result.stdout,
                    stderr: result.stderr,
                    time: result.time,
                    testCaseIndex: i + 1,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    actualOutput: result.stdout ?? ""
                };

                if (!firstFailure) {
                    firstFailure = enrichedResult;
                }
            }
        }
    } finally {
        // Cleanup files and folder
        try {
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(tempDir, file));
                }
                fs.rmdirSync(tempDir);
            }
        } catch (cleanupErr) {
            console.error("[LocalRunner] Error during temp folder cleanup:", cleanupErr);
        }
    }

    return {
        passed,
        total: testCases.length,
        firstFailure,
        lastResult
    };
}

function executeTestCase(
    command: string,
    args: string[],
    cwd: string,
    input: string,
    timeoutMs: number = 3000
): Promise<LocalRunResult> {
    return new Promise((resolve) => {
        const startTime = process.hrtime();
        let stdout = "";
        let stderr = "";
        let completed = false;

        const child = spawn(command, args, { cwd });

        const timer = setTimeout(() => {
            if (!completed) {
                completed = true;
                try {
                    child.kill("SIGKILL");
                } catch (e) {}
                resolve({
                    status: { id: 5, description: "Time Limit Exceeded" },
                    stdout,
                    stderr: stderr + "\n[LocalRunner] Execution timed out after " + timeoutMs + "ms",
                    time: (timeoutMs / 1000).toFixed(3)
                });
            }
        }, timeoutMs);

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("error", (err) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                resolve({
                    status: { id: 11, description: "Runtime Error" },
                    stdout,
                    stderr: stderr + "\n" + err.message,
                    time: "0.000"
                });
            }
        });

        child.on("close", (code) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                const diff = process.hrtime(startTime);
                const timeTakenSec = (diff[0] + diff[1] / 1e9).toFixed(3);

                if (code !== 0) {
                    resolve({
                        status: { id: 11, description: "Runtime Error" },
                        stdout,
                        stderr: stderr + `\n[LocalRunner] Process exited with code ${code}`,
                        time: timeTakenSec
                    });
                } else {
                    resolve({
                        status: { id: 3, description: "Accepted" },
                        stdout,
                        stderr: stderr || undefined,
                        time: timeTakenSec
                    });
                }
            }
        });

        // Write input to standard input
        try {
            child.stdin.write(input);
            child.stdin.end();
        } catch (e: any) {
            // If stdin writing fails because process crashed instantly
            stderr += "\n[LocalRunner] Failed to write to stdin: " + e.message;
        }
    });
}

import mongoose from "mongoose";

import Match from "../models/match.model.js";
import UserProfile from "../models/userProfile.model.js";
import Achievement from "../models/achievement.model.js";
import Notification from "../models/notification.model.js";
import { io } from "../index.js";

// ─────────────────────────────────────────────
// Achievement definitions
// ─────────────────────────────────────────────
//
// These mirror what should be seeded into the Achievement collection.
// Each checker is a pure function that returns true when the player
// has met the requirement, given their current UserProfile stats/ratings.
//
// Achievement.category enum: "RATING" | "MATCHES" | "STREAK" | "DSA" | "PROMPT_WAR" | "SPECIAL"
// Achievement.requirement: the numeric threshold (e.g. 10 wins, 1500 rating)
//
// The name string must exactly match Achievement.name in the DB.

interface AchievementChecker {
    name: string;
    check: (profile: any) => boolean;
}

interface AchievementData {
    name: string;
    description: string;
    category: "RATING" | "MATCHES" | "STREAK" | "DSA" | "PROMPT_WAR" | "SPECIAL";
    rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
    requirement: number;
    xpReward: number;
    icon: string;
    mascotReward?: {
        name: string;
        icon: string;
        description: string;
        type: string;
        rarity: string;
    };
    check: (profile: any) => boolean;
}

export const ACHIEVEMENTS_DATA: AchievementData[] = [
    // ── MATCHES PLAYED (8 achievements) ──
    {
        name: "First Blood",
        description: "Step into the arena and play your first match. Unlocks the Byte Kitten companion!",
        category: "MATCHES",
        rarity: "COMMON",
        requirement: 1,
        xpReward: 50,
        icon: "⚔️",
        mascotReward: {
            name: "Byte Kitten",
            icon: "🐱",
            description: "A soft little kitty that purrs when your code compiles.",
            type: "cat",
            rarity: "COMMON"
        },
        check: (p) => p.stats.totalMatches >= 1
    },
    {
        name: "Rising Gladiator",
        description: "Prove your commitment by playing 5 matches. Unlocks the Hamster Thread companion!",
        category: "MATCHES",
        rarity: "COMMON",
        requirement: 5,
        xpReward: 100,
        icon: "🛡️",
        mascotReward: {
            name: "Hamster Thread",
            icon: "🐹",
            description: "Runs on a wheel to keep your background tasks alive.",
            type: "hamster",
            rarity: "COMMON"
        },
        check: (p) => p.stats.totalMatches >= 5
    },
    {
        name: "Battle Hardened",
        description: "Engage in 10 intense matches. Unlocks the Panda Cub companion!",
        category: "MATCHES",
        rarity: "COMMON",
        requirement: 10,
        xpReward: 150,
        icon: "🛡️",
        mascotReward: {
            name: "Panda Cub",
            icon: "🐼",
            description: "A sleepy panda cub that cuddles up to your variables.",
            type: "panda",
            rarity: "COMMON"
        },
        check: (p) => p.stats.totalMatches >= 10
    },
    {
        name: "Arena Regular",
        description: "Become a familiar face in the arena with 25 matches.",
        category: "MATCHES",
        rarity: "RARE",
        requirement: 25,
        xpReward: 250,
        icon: "⚔️",
        check: (p) => p.stats.totalMatches >= 25
    },
    {
        name: "Bronze Veteran",
        description: "Stand tall after playing 50 matches.",
        category: "MATCHES",
        rarity: "RARE",
        requirement: 50,
        xpReward: 400,
        icon: "🎖️",
        check: (p) => p.stats.totalMatches >= 50
    },
    {
        name: "Legend",
        description: "Enter the halls of fame by completing 100 matches.",
        category: "MATCHES",
        rarity: "EPIC",
        requirement: 100,
        xpReward: 750,
        icon: "👑",
        check: (p) => p.stats.totalMatches >= 100
    },
    {
        name: "Centurion",
        description: "Complete a whopping 250 matches.",
        category: "MATCHES",
        rarity: "EPIC",
        requirement: 250,
        xpReward: 1200,
        icon: "🏛️",
        check: (p) => p.stats.totalMatches >= 250
    },
    {
        name: "Arena Champion",
        description: "Achieve ultimate mastery with 500 matches played.",
        category: "MATCHES",
        rarity: "LEGENDARY",
        requirement: 500,
        xpReward: 2500,
        icon: "🏆",
        check: (p) => p.stats.totalMatches >= 500
    },

    // ── MATCH WINS (7 achievements) ──
    {
        name: "First Win",
        description: "Claim your first victory in the arena. Unlocks the Debug Puppy companion!",
        category: "MATCHES",
        rarity: "COMMON",
        requirement: 1,
        xpReward: 100,
        icon: "🥇",
        mascotReward: {
            name: "Debug Puppy",
            icon: "🐶",
            description: "A friendly pup that sniffs out syntax errors.",
            type: "dog",
            rarity: "COMMON"
        },
        check: (p) => p.stats.wins >= 1
    },
    {
        name: "Victorious",
        description: "Triumph in 5 matches. Unlocks the Rusty Crab companion!",
        category: "MATCHES",
        rarity: "COMMON",
        requirement: 5,
        xpReward: 200,
        icon: "🏅",
        mascotReward: {
            name: "Rusty Crab",
            icon: "🦀",
            description: "A small crab that clicks its claws to the beat of your typing.",
            type: "crab",
            rarity: "COMMON"
        },
        check: (p) => p.stats.wins >= 5
    },
    {
        name: "10 Victories",
        description: "Win 10 matches against challengers. Unlocks the Octo-Junior companion!",
        category: "MATCHES",
        rarity: "COMMON",
        requirement: 10,
        xpReward: 300,
        icon: "🏆",
        mascotReward: {
            name: "Octo-Junior",
            icon: "🐙",
            description: "A little octopus trying to type on 8 keyboards at once.",
            type: "octopus",
            rarity: "COMMON"
        },
        check: (p) => p.stats.wins >= 10
    },
    {
        name: "Conqueror",
        description: "Amass 25 wins in the arena.",
        category: "MATCHES",
        rarity: "RARE",
        requirement: 25,
        xpReward: 500,
        icon: "👑",
        check: (p) => p.stats.wins >= 25
    },
    {
        name: "50 Victories",
        description: "Amass 50 wins in the arena.",
        category: "MATCHES",
        rarity: "RARE",
        requirement: 50,
        xpReward: 800,
        icon: "🔱",
        check: (p) => p.stats.wins >= 50
    },
    {
        name: "Unstoppable Force",
        description: "Reach 100 match wins.",
        category: "MATCHES",
        rarity: "EPIC",
        requirement: 100,
        xpReward: 1500,
        icon: "☄️",
        check: (p) => p.stats.wins >= 100
    },
    {
        name: "Grand Champion",
        description: "An absolute conqueror with 250 match wins.",
        category: "MATCHES",
        rarity: "LEGENDARY",
        requirement: 250,
        xpReward: 3500,
        icon: "⚜️",
        check: (p) => p.stats.wins >= 250
    },

    // ── WIN STREAKS (6 achievements) ──
    {
        name: "Getting Warm",
        description: "Win 2 matches in a row. Unlocks the Ping Frog companion!",
        category: "STREAK",
        rarity: "COMMON",
        requirement: 2,
        xpReward: 50,
        icon: "⚡",
        mascotReward: {
            name: "Ping Frog",
            icon: "🐸",
            description: "A jumpy frog that checks network responses and latency.",
            type: "frog",
            rarity: "COMMON"
        },
        check: (p) => p.streak >= 2
    },
    {
        name: "Hot Streak",
        description: "Win 3 matches in a row. Unlocks the Git Bunny companion!",
        category: "STREAK",
        rarity: "COMMON",
        requirement: 3,
        xpReward: 100,
        icon: "🔥",
        mascotReward: {
            name: "Git Bunny",
            icon: "🐰",
            description: "Fast at staging and hopping through git commits.",
            type: "bunny",
            rarity: "COMMON"
        },
        check: (p) => p.streak >= 3
    },
    {
        name: "On Fire",
        description: "Reach a 5-win streak. Unlocks the Shell Turtle companion!",
        category: "STREAK",
        rarity: "RARE",
        requirement: 5,
        xpReward: 250,
        icon: "💥",
        mascotReward: {
            name: "Shell Turtle",
            icon: "🐢",
            description: "Slow but steady, executes commands with high patience.",
            type: "turtle",
            rarity: "COMMON"
        },
        check: (p) => p.streak >= 5
    },
    {
        name: "Supernova",
        description: "Reach a 7-win streak.",
        category: "STREAK",
        rarity: "RARE",
        requirement: 7,
        xpReward: 500,
        icon: "☀️",
        check: (p) => p.streak >= 7
    },
    {
        name: "Unstoppable",
        description: "Achieve a legendary 10-win streak. Unlocks the Phoenix Pet!",
        category: "STREAK",
        rarity: "EPIC",
        requirement: 10,
        xpReward: 1000,
        icon: "🐦🔥",
        mascotReward: {
            name: "Phoenix",
            icon: "🦅🔥",
            description: "Rises from the ashes of crash logs to revive server connections.",
            type: "phoenix",
            rarity: "LEGENDARY"
        },
        check: (p) => p.streak >= 10
    },
    {
        name: "Godlike",
        description: "An unbelievable 15-win streak. Ascend to divinity.",
        category: "STREAK",
        rarity: "LEGENDARY",
        requirement: 15,
        xpReward: 3000,
        icon: "🌌",
        check: (p) => p.streak >= 15
    },

    // ── RATINGS (7 achievements) ──
    {
        name: "Novice Challenger",
        description: "Reach 1300 rating in any mode. Unlocks the Null Koala companion!",
        category: "RATING",
        rarity: "COMMON",
        requirement: 1300,
        xpReward: 100,
        icon: "⭐",
        mascotReward: {
            name: "Null Koala",
            icon: "🐨",
            description: "Spends all day clinging to tree branches and returning null pointer exceptions.",
            type: "koala",
            rarity: "COMMON"
        },
        check: (p) => Object.values(p.ratings as Record<string, number>).some((r) => r >= 1300)
    },
    {
        name: "Rising Star",
        description: "Reach 1400 rating in any mode. Unlocks the Regex Fox companion!",
        category: "RATING",
        rarity: "COMMON",
        requirement: 1400,
        xpReward: 200,
        icon: "🌟",
        mascotReward: {
            name: "Regex Fox",
            icon: "🦊",
            description: "A clever fox that resolves pattern matches in milliseconds.",
            type: "fox",
            rarity: "RARE"
        },
        check: (p) => Object.values(p.ratings as Record<string, number>).some((r) => r >= 1400)
    },
    {
        name: "Elite Competitor",
        description: "Reach 1500 rating in any mode. Unlocks the Stack Owl companion!",
        category: "RATING",
        rarity: "RARE",
        requirement: 1500,
        xpReward: 350,
        icon: "✨",
        mascotReward: {
            name: "Stack Owl",
            icon: "🦉",
            description: "A wise owl that monitors memory allocations and call stacks.",
            type: "owl",
            rarity: "RARE"
        },
        check: (p) => Object.values(p.ratings as Record<string, number>).some((r) => r >= 1500)
    },
    {
        name: "Expert",
        description: "Reach 1600 rating in any mode. Unlocks the Cache Squirrel companion!",
        category: "RATING",
        rarity: "RARE",
        requirement: 1600,
        xpReward: 500,
        icon: "🔮",
        mascotReward: {
            name: "Cache Squirrel",
            icon: "🐿️",
            description: "Stores database responses and nuts in memory.",
            type: "squirrel",
            rarity: "RARE"
        },
        check: (p) => Object.values(p.ratings as Record<string, number>).some((r) => r >= 1600)
    },
    {
        name: "Master",
        description: "Reach 1800 rating in any mode. Unlocks the Bit Badger companion!",
        category: "RATING",
        rarity: "EPIC",
        requirement: 1800,
        xpReward: 1000,
        icon: "👑",
        mascotReward: {
            name: "Bit Badger",
            icon: "🦡",
            description: "Digs deep into compiled assemblies to reverse-engineer binaries.",
            type: "badger",
            rarity: "RARE"
        },
        check: (p) => Object.values(p.ratings as Record<string, number>).some((r) => r >= 1800)
    },
    {
        name: "Grandmaster",
        description: "Reach 2000 rating in any competitive mode.",
        category: "RATING",
        rarity: "EPIC",
        requirement: 2000,
        xpReward: 1500,
        icon: "💎",
        check: (p) => Object.values(p.ratings as Record<string, number>).some((r) => r >= 2000)
    },
    {
        name: "Legendary Coder",
        description: "Reach 2200 rating in any competitive mode. Unlocks the Code Dragon Pet!",
        category: "RATING",
        rarity: "LEGENDARY",
        requirement: 2200,
        xpReward: 4000,
        icon: "🐉",
        mascotReward: {
            name: "Code Dragon",
            icon: "🐉",
            description: "A legendary dragon that breathes fire onto legacy codebases.",
            type: "dragon",
            rarity: "LEGENDARY"
        },
        check: (p) => Object.values(p.ratings as Record<string, number>).some((r) => r >= 2200)
    },

    // ── DSA SOLVES (7 achievements) ──
    {
        name: "DSA Starter",
        description: "Solve your first DSA question. Unlocks the Token Sloth companion!",
        category: "DSA",
        rarity: "COMMON",
        requirement: 1,
        xpReward: 50,
        icon: "💻",
        mascotReward: {
            name: "Token Sloth",
            icon: "🦥",
            description: "Refreshes authentication tokens at a very leisurely pace.",
            type: "sloth",
            rarity: "RARE"
        },
        check: (p) => p.stats.dsaSolved >= 1
    },
    {
        name: "Problem Solver",
        description: "Solve 10 DSA questions. Unlocks the Dino Compiler companion!",
        category: "DSA",
        rarity: "COMMON",
        requirement: 10,
        xpReward: 150,
        icon: "🧠",
        mascotReward: {
            name: "Dino Compiler",
            icon: "🦖",
            description: "An ancient compiler that roars at legacy code.",
            type: "dino",
            rarity: "RARE"
        },
        check: (p) => p.stats.dsaSolved >= 10
    },
    {
        name: "Algorithm Ace",
        description: "Solve 25 DSA questions. Unlocks the Docker Whale companion!",
        category: "DSA",
        rarity: "RARE",
        requirement: 25,
        xpReward: 300,
        icon: "🧩",
        mascotReward: {
            name: "Docker Whale",
            icon: "🐳",
            description: "Carries entire application containers on its back.",
            type: "whale",
            rarity: "RARE"
        },
        check: (p) => p.stats.dsaSolved >= 25
    },
    {
        name: "Logic Wizard",
        description: "Solve 50 DSA questions. Unlocks the Web Otter companion!",
        category: "DSA",
        rarity: "RARE",
        requirement: 50,
        xpReward: 500,
        icon: "🧙‍♂️",
        mascotReward: {
            name: "Web Otter",
            icon: "🦦",
            description: "Floats on the stream of real-time web sockets.",
            type: "otter",
            rarity: "RARE"
        },
        check: (p) => p.stats.dsaSolved >= 50
    },
    {
        name: "Data Structure Guru",
        description: "Solve 100 DSA questions.",
        category: "DSA",
        rarity: "EPIC",
        requirement: 100,
        xpReward: 1000,
        icon: "🏛️",
        check: (p) => p.stats.dsaSolved >= 100
    },
    {
        name: "Leet Elite",
        description: "Solve 200 DSA questions.",
        category: "DSA",
        rarity: "EPIC",
        requirement: 200,
        xpReward: 1800,
        icon: "🛸",
        check: (p) => p.stats.dsaSolved >= 200
    },
    {
        name: "Algorithm Overlord",
        description: "Solve 500 DSA questions. Unlocks the Byte Unicorn Pet!",
        category: "DSA",
        rarity: "LEGENDARY",
        requirement: 500,
        xpReward: 5000,
        icon: "🦉",
        mascotReward: {
            name: "Byte Unicorn",
            icon: "🦄",
            description: "A rare mythical beast representing flawless, bug-free productions.",
            type: "unicorn",
            rarity: "LEGENDARY"
        },
        check: (p) => p.stats.dsaSolved >= 500
    },

    // ── PROMPT WAR (6 achievements) ──
    {
        name: "Prompt Novice",
        description: "Reach 1300 rating in Prompt War. Unlocks the Cyber Monkey companion!",
        category: "PROMPT_WAR",
        rarity: "COMMON",
        requirement: 1300,
        xpReward: 100,
        icon: "🤖",
        mascotReward: {
            name: "Cyber Monkey",
            icon: "🐒",
            description: "A mischievous monkey that tests resilience by randomly unplugging cords.",
            type: "monkey",
            rarity: "EPIC"
        },
        check: (p) => (p.ratings.promptWar ?? 0) >= 1300
    },
    {
        name: "Prompt Warrior",
        description: "Reach 1400 rating in Prompt War. Unlocks the Quantum Cat companion!",
        category: "PROMPT_WAR",
        rarity: "COMMON",
        requirement: 1400,
        xpReward: 200,
        icon: "🤖",
        mascotReward: {
            name: "Quantum Cat",
            icon: "🐈‍⬛",
            description: "Exists in both compiled and uncompiled states until observed.",
            type: "quantum_cat",
            rarity: "EPIC"
        },
        check: (p) => (p.ratings.promptWar ?? 0) >= 1400
    },
    {
        name: "Prompt Commander",
        description: "Reach 1500 rating in Prompt War. Unlocks the API Dolphin companion!",
        category: "PROMPT_WAR",
        rarity: "RARE",
        requirement: 1500,
        xpReward: 350,
        icon: "🔮",
        mascotReward: {
            name: "API Dolphin",
            icon: "🐬",
            description: "Gracefully swims through request pathways and returns status 200.",
            type: "dolphin",
            rarity: "EPIC"
        },
        check: (p) => (p.ratings.promptWar ?? 0) >= 1500
    },
    {
        name: "AI Whisperer",
        description: "Reach 1600 rating in Prompt War. Unlocks the Firewall Lion companion!",
        category: "PROMPT_WAR",
        rarity: "RARE",
        requirement: 1600,
        xpReward: 500,
        icon: "🌌",
        mascotReward: {
            name: "Firewall Lion",
            icon: "🦁",
            description: "A majestic protector that blocks malicious ports and security threats.",
            type: "lion",
            rarity: "EPIC"
        },
        check: (p) => (p.ratings.promptWar ?? 0) >= 1600
    },
    {
        name: "Prompt Master",
        description: "Reach 1800 rating in Prompt War. Unlocks the Kernel Raccoon companion!",
        category: "PROMPT_WAR",
        rarity: "EPIC",
        requirement: 1800,
        xpReward: 1000,
        icon: "👑",
        mascotReward: {
            name: "Kernel Raccoon",
            icon: "🦝",
            description: "Steals garbage collection references and root privileges.",
            type: "raccoon",
            rarity: "EPIC"
        },
        check: (p) => (p.ratings.promptWar ?? 0) >= 1800
    },
    {
        name: "Prompt Legend",
        description: "Reach 2000 rating in Prompt War. Unlocks the AI Cyber-Fox Pet!",
        category: "PROMPT_WAR",
        rarity: "LEGENDARY",
        requirement: 2000,
        xpReward: 4000,
        icon: "🦊",
        mascotReward: {
            name: "AI Cyber-Fox",
            icon: "🦊⚡",
            description: "A neon cybernetic fox that whispers perfect prompt structures.",
            type: "cyber_fox",
            rarity: "LEGENDARY"
        },
        check: (p) => (p.ratings.promptWar ?? 0) >= 2000
    },

    // ── SPECIAL DEVELOPMENT CHALLENGES (9 achievements) ──
    {
        name: "Frontend Learner",
        description: "Complete your first Frontend challenge. Unlocks the Prompt Parrot companion!",
        category: "SPECIAL",
        rarity: "COMMON",
        requirement: 1,
        xpReward: 50,
        icon: "🎨",
        mascotReward: {
            name: "Prompt Parrot",
            icon: "🦜",
            description: "Echoes user instructions in natural language formats.",
            type: "parrot",
            rarity: "EPIC"
        },
        check: (p) => p.stats.frontendCompleted >= 1
    },
    {
        name: "Frontend Artisan",
        description: "Complete 10 Frontend challenges.",
        category: "SPECIAL",
        rarity: "RARE",
        requirement: 10,
        xpReward: 300,
        icon: "🖌️",
        check: (p) => p.stats.frontendCompleted >= 10
    },
    {
        name: "Frontend Master",
        description: "Complete 50 Frontend challenges.",
        category: "SPECIAL",
        rarity: "EPIC",
        requirement: 50,
        xpReward: 1000,
        icon: "🎆",
        check: (p) => p.stats.frontendCompleted >= 50
    },
    {
        name: "Backend Learner",
        description: "Complete your first Backend challenge. Unlocks the Syntax Snake companion!",
        category: "SPECIAL",
        rarity: "COMMON",
        requirement: 1,
        xpReward: 50,
        icon: "💾",
        mascotReward: {
            name: "Syntax Snake",
            icon: "🐍",
            description: "Slithers smoothly through nested loops and Python code.",
            type: "snake",
            rarity: "EPIC"
        },
        check: (p) => p.stats.backendCompleted >= 1
    },
    {
        name: "Backend Architect",
        description: "Complete 10 Backend challenges.",
        category: "SPECIAL",
        rarity: "RARE",
        requirement: 10,
        xpReward: 300,
        icon: "🖧",
        check: (p) => p.stats.backendCompleted >= 10
    },
    {
        name: "Backend Overlord",
        description: "Complete 50 Backend challenges.",
        category: "SPECIAL",
        rarity: "EPIC",
        requirement: 50,
        xpReward: 1000,
        icon: "⚡",
        check: (p) => p.stats.backendCompleted >= 50
    },
    {
        name: "Projects Initiate",
        description: "Complete your first Projects challenge.",
        category: "SPECIAL",
        rarity: "COMMON",
        requirement: 1,
        xpReward: 100,
        icon: "🚀",
        check: (p) => p.stats.projectsCompleted >= 1
    },
    {
        name: "Projects Developer",
        description: "Complete 10 Projects challenges.",
        category: "SPECIAL",
        rarity: "RARE",
        requirement: 10,
        xpReward: 500,
        icon: "🌐",
        check: (p) => p.stats.projectsCompleted >= 10
    },
    {
        name: "Projects Titan",
        description: "Complete 50 Projects challenges. Unlocks the Polymer Robo-Puppy Pet!",
        category: "SPECIAL",
        rarity: "LEGENDARY",
        requirement: 50,
        xpReward: 5000,
        icon: "🐶",
        mascotReward: {
            name: "Polymer Robo-Puppy",
            icon: "🤖🐶",
            description: "The ultimate projects machine-learning companion puppy.",
            type: "robo_puppy",
            rarity: "LEGENDARY"
        },
        check: (p) => p.stats.projectsCompleted >= 50
    }
];

const ACHIEVEMENT_CHECKERS: AchievementChecker[] = ACHIEVEMENTS_DATA;


// ─────────────────────────────────────────────
// Internal: unlock a single achievement for a user
// ─────────────────────────────────────────────

async function unlockAchievement(
    userId: string,
    achievement: any,
    profile: any
): Promise<void> {

    const alreadyUnlocked = (profile.achievements as mongoose.Types.ObjectId[])
        .some((id) => id.toString() === achievement._id.toString());

    if (alreadyUnlocked) return;

    // Push achievement + badge reference atomically
    await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
            $addToSet: {
                achievements: achievement._id,
                badges:       achievement._id,
            }
        }
    );

    // Notify the player
    const notification = await Notification.create({
        recipient:       new mongoose.Types.ObjectId(userId),
        type:            "ACHIEVEMENT_UNLOCKED",
        title:           "Achievement Unlocked",
        message:         `You unlocked "${achievement.name}" — ${achievement.description}`,
        relatedEntityId: achievement._id,
    });

    try {
        io.to(`user:${userId}`).emit("notification:new", notification);
        io.to(`user:${userId}`).emit("achievement:unlocked", {
            _id: achievement._id,
            name: achievement.name,
            description: achievement.description,
            rarity: achievement.rarity,
            category: achievement.category,
            xpReward: achievement.xpReward,
            icon: achievement.icon,
        });
    } catch (socketErr) {
        console.error("[AchievementService] Failed to emit socket notification:", socketErr);
    }

    console.log(
        `[AchievementService] User ${userId} unlocked "${achievement.name}"`
    );
}


// ─────────────────────────────────────────────
// Main export: checkAchievements
// ─────────────────────────────────────────────

/**
 * Called by match.controller (fire-and-forget) after a match ends.
 * Runs every registered checker against each player's current profile
 * and unlocks any newly-met achievements.
 *
 * @param playerIds  Array of userId strings (all players in the match)
 * @param matchId    ObjectId string of the completed Match (for logging)
 */
export async function checkAchievements(
    playerIds: string[],
    matchId: string
): Promise<void> {

    // Load all Achievement docs once — shared across all players
    const allAchievements = await Achievement.find({});

    if (allAchievements.length === 0) {
        console.warn("[AchievementService] No achievements seeded in DB — skipping");
        return;
    }

    // Build a quick lookup: name → Achievement doc
    const achievementByName = new Map(
        allAchievements.map((a) => [a.name, a])
    );

    // FIX (I4): previously did one `UserProfile.findOne` per player inside
    // the loop below (2 reads for a 1v1, 8 for a 4v4). Batched into a
    // single query upfront, looked up in-memory per player instead.
    const playerObjectIds = playerIds.map((id) => new mongoose.Types.ObjectId(id));
    const profiles = await UserProfile.find({ userId: { $in: playerObjectIds } });
    const profileByUserId = new Map(
        profiles.map((p) => [p.userId.toString(), p])
    );

    for (const userId of playerIds) {
        try {
            const profile = profileByUserId.get(userId);

            if (!profile) {
                console.warn(`[AchievementService] No profile for user ${userId} — skipping`);
                continue;
            }

            for (const checker of ACHIEVEMENT_CHECKERS) {
                const achievement = achievementByName.get(checker.name);

                if (!achievement) {
                    // Achievement not seeded yet — skip silently
                    continue;
                }

                if (checker.check(profile)) {
                    await unlockAchievement(userId, achievement, profile);
                }
            }
        } catch (err) {
            // Never let one player's failure block the rest
            console.error(
                `[AchievementService] Error checking achievements for user ${userId}:`,
                err
            );
        }
    }

    console.log(
        `[AchievementService] Achievement check complete for match ${matchId} ` +
        `(${playerIds.length} player(s))`
    );
}


// ─────────────────────────────────────────────
// Export: checkAchievementsForUser
// ─────────────────────────────────────────────

/**
 * Single-user variant — useful for manual triggers or profile updates
 * that happen outside of a match (e.g. DSA solve count incremented).
 */
export async function checkAchievementsForUser(userId: string): Promise<void> {
    await checkAchievements([userId], "manual");
}


// ─────────────────────────────────────────────
// Export: seedAchievements
// ─────────────────────────────────────────────

export async function seedAchievements(): Promise<void> {
    try {
        console.log("[AchievementService] Seeding achievements...");
        for (const data of ACHIEVEMENTS_DATA) {
            const { check, ...dbFields } = data;
            await Achievement.findOneAndUpdate(
                { name: dbFields.name },
                { $set: dbFields },
                { upsert: true, new: true }
            );
        }
        console.log("[AchievementService] Seeding completed successfully. 50 achievements configured.");
    } catch (error) {
        console.error("[AchievementService] Seeding failed:", error);
    }
}
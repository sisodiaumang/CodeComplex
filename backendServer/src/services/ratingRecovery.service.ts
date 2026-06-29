import Match from "../models/match.model.js";
import { applyRankedRatings } from "./match.service.js";

// ─────────────────────────────────────────────────────────────────────────
// FIX (I5): no scheduled job or recovery path existed for matches whose
// rating update never completed (process crash mid-update, a fire-and-
// forget rating call that failed and was only logged, etc). match.model.ts
// already documents the intended recovery query and carries the
// { status: 1, ratingProcessed: 1 } index to support it efficiently — this
// just implements the job that was missing.
//
// Safe to call repeatedly / concurrently: applyRankedRatings → updateRatings
// / updateRatingsForDraw all re-check match.ratingProcessed before doing any
// writes, so reprocessing an already-settled match is a no-op.
//
// Wiring suggestion (not done here — no server bootstrap file was provided):
//   - Call `recoverUnprocessedRatings()` once on server startup, to catch
//     anything missed across a restart.
//   - Also run it on a periodic schedule (e.g. every 5–10 minutes) via
//     node-cron or a plain `setInterval`, so a missed match doesn't sit
//     unprocessed indefinitely between restarts:
//
//       import cron from "node-cron";
//       cron.schedule("*/10 * * * *", () => {
//         recoverUnprocessedRatings().catch((err) =>
//           console.error("[RatingRecovery] Scheduled run failed:", err)
//         );
//       });
// ─────────────────────────────────────────────────────────────────────────

/**
 * Re-runs rating processing for every completed, RANKED match that never
 * got marked ratingProcessed: true.
 *
 * NOTE: this covers status "COMPLETED" (the case match.model.ts's comment
 * calls out, and the only case applyRankedRatings knows how to replay from
 * match.winnerTeam alone). "ABANDONED" matches are settled via
 * applyAbandonRating with an explicit winner/abandoner pair at the time of
 * the abandon call, which isn't reconstructable from the Match doc alone —
 * if abandon-side recovery turns out to be needed too, abandonReason would
 * need to start encoding the winning side's player ids, not just who quit.
 */
export async function recoverUnprocessedRatings(): Promise<void> {
    const unprocessed = await Match.find({
        status: "COMPLETED",
        ratingProcessed: false,
        matchType: "RANKED",
    });

    if (unprocessed.length === 0) {
        return;
    }

    console.log(
        `[RatingRecovery] Found ${unprocessed.length} completed RANKED match(es) ` +
        `with ratingProcessed: false — reprocessing.`
    );

    for (const match of unprocessed) {
        try {
            await applyRankedRatings(match);
        } catch (err) {
            // Never let one bad match block the rest of the batch.
            console.error(
                `[RatingRecovery] Failed to reprocess ratings for match ${match._id}:`,
                err
            );
        }
    }
}
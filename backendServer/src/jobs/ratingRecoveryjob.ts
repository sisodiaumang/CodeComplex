import { recoverUnprocessedRatings } from "../services/ratingRecovery.service.js";

const RECOVERY_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

/**
 * Starts the rating-recovery job.
 *
 * Mirrors the existing startCleanupJob() pattern (jobs/cleanUnverifedUser.js):
 * call once at boot, after the DB connection is established, and it manages
 * its own recurring schedule for the lifetime of the process.
 *
 * Runs once immediately on startup (to catch anything missed across a
 * crash/restart), then every RECOVERY_INTERVAL_MS while the server is up,
 * to catch matches whose rating update failed mid-run without needing a
 * restart to recover them.
 */
export default function startRatingRecoveryJob(): void {
    recoverUnprocessedRatings().catch((err) =>
        console.error("[RatingRecovery] Initial startup run failed:", err)
    );

    setInterval(() => {
        recoverUnprocessedRatings().catch((err) =>
            console.error("[RatingRecovery] Scheduled run failed:", err)
        );
    }, RECOVERY_INTERVAL_MS);

    console.log(
        `[RatingRecovery] Job started — checking every ${RECOVERY_INTERVAL_MS / 60000} minute(s)`
    );
}
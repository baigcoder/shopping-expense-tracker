-- Prevent the same checkout from flooding the inbox.
-- Rejected rows can be recaptured; pending/approved/merged hashes stay unique per user.

CREATE UNIQUE INDEX IF NOT EXISTS transaction_candidates_pending_hash_uidx
    ON public.transaction_candidates (user_id, transaction_hash)
    WHERE status = 'pending'
      AND transaction_hash IS NOT NULL
      AND transaction_hash <> '';

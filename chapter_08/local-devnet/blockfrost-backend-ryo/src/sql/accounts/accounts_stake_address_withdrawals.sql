SELECT encode(tx_hash, 'hex') AS "tx_hash",
  amount::TEXT AS "amount" -- cast to TEXT to avoid number overflow
FROM(
    SELECT tx.id AS "id",
      tx.hash AS "tx_hash",
      w.amount AS "amount"
    FROM tx
      JOIN withdrawal w ON (tx.id = w.tx_id)
      JOIN stake_address sa ON (sa.id = w.addr_id)
    WHERE sa.view = $4
  ) AS "unordered_txs"
ORDER BY CASE
    WHEN LOWER($1) = 'desc' THEN id
  END DESC,
  CASE
    WHEN LOWER($1) <> 'desc'
    OR $1 IS NULL THEN id
  END ASC
LIMIT CASE
    WHEN $2 >= 1
    AND $2 <= 100 THEN $2
    ELSE 100
  END OFFSET CASE
    WHEN $3 > 1
    AND $3 < 2147483647 THEN ($3 - 1) * (
      CASE
        WHEN $2 >= 1
        AND $2 <= 100 THEN $2
        ELSE 100
      END
    )
    ELSE 0
  END
function walletResponse(wallet) {
  const w = wallet.toObject
    ? wallet.toObject()
    : wallet;

  const user =
    w.userId &&
    typeof w.userId === "object"
      ? w.userId
      : null;

  const stage1 =
    w.stage1ReviewedBy &&
    typeof w.stage1ReviewedBy === "object"
      ? w.stage1ReviewedBy
      : null;

  const stage2 =
    w.stage2ReviewedBy &&
    typeof w.stage2ReviewedBy === "object"
      ? w.stage2ReviewedBy
      : null;

  const stage3 =
    w.stage3ReviewedBy &&
    typeof w.stage3ReviewedBy === "object"
      ? w.stage3ReviewedBy
      : null;

  const failed =
    w.failedBy &&
    typeof w.failedBy === "object"
      ? w.failedBy
      : null;

  return {
    id: w._id.toString(),

    coinName: w.coinName,

    tradeId: w.tradeId,

    notes: w.notes || "",

    userId: user
      ? user._id.toString()
      : String(w.userId),

    userName: user?.name || "",

    userEmail: user?.email || "",

    creatorRole: user?.role || "",

    stage: w.stage,

    status: w.status,

    costPrice: w.costPrice,

    soldPrice: w.soldPrice,

    /*
     * Stage 1
     */
    stage1ReviewedBy:
      stage1?.name || null,

    stage1ReviewedByRole:
      stage1?.role || null,

    stage1ReviewedAt:
      w.stage1ReviewedAt,

    /*
     * Stage 2
     */
    stage2ReviewedBy:
      stage2?.name || null,

    stage2ReviewedByRole:
      stage2?.role || null,

    stage2ReviewedAt:
      w.stage2ReviewedAt,

    /*
     * Stage 3
     */
    stage3ReviewedBy:
      stage3?.name || null,

    stage3ReviewedByRole:
      stage3?.role || null,

    stage3ReviewedAt:
      w.stage3ReviewedAt,

    /*
     * Failed
     */
    failedBy:
      failed?.name || null,

    failedAt:
      w.failedAt,

    /*
     * Dates
     */
    dateAdded:
      w.createdAt,

    lastUpdated:
      w.updatedAt,

    /*
     * History
     */
    history: (
      w.history || []
    ).map((h) => ({
      id: h._id.toString(),

      type: h.type,

      by: h.by,

      byUserId:
        h.byUser?.toString(),

      at: h.at,

      detail: h.detail,
    })),
  };
}

module.exports = {
  walletResponse,
};
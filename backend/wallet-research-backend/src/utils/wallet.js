function walletResponse(wallet) {
  const w = wallet.toObject ? wallet.toObject() : wallet;
  const user = w.userId && typeof w.userId === "object" ? w.userId : null;
  const stage1 = w.stage1ReviewedBy && typeof w.stage1ReviewedBy === "object" ? w.stage1ReviewedBy : null;
  const stage2 = w.stage2ReviewedBy && typeof w.stage2ReviewedBy === "object" ? w.stage2ReviewedBy : null;
  const failed = w.failedBy && typeof w.failedBy === "object" ? w.failedBy : null;
  return {
    id: w._id.toString(),
    coinName: w.coinName,
    tradeId: w.tradeId,
    notes: w.notes || "",
    userId: user ? user._id.toString() : String(w.userId),
    userName: user?.name || "",
    userEmail: user?.email || "",
    stage: w.stage,
    status: w.status,
    costPrice: w.costPrice,
    soldPrice: w.soldPrice,
    stage1ReviewedBy: stage1?.name || null,
    stage1ReviewedAt: w.stage1ReviewedAt,
    stage2ReviewedBy: stage2?.name || null,
    stage2ReviewedAt: w.stage2ReviewedAt,
    failedBy: failed?.name || null,
    failedAt: w.failedAt,
    dateAdded: w.createdAt,
    lastUpdated: w.updatedAt,
    history: (w.history || []).map(h => ({ id: h._id.toString(), type: h.type, by: h.by, byUserId: h.byUser?.toString(), at: h.at, detail: h.detail }))
  };
}

module.exports = { walletResponse };

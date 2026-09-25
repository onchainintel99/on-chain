const ROLES = Object.freeze({
  USER: "user",
  MANAGER1: "manager1",
  MANAGER2: "manager2",
  ADMIN: "admin",
});

const STATUSES = Object.freeze({
  PENDING_STAGE1: "Pending Stage 1",
  PENDING_STAGE2: "Pending Stage 2",
  PENDING_STAGE3: "Pending Stage 3",
  SUCCESSFUL: "Successful",
  FAILED: "Failed",
});

const HISTORY_TYPES = Object.freeze({
  CREATED: "created",

  STAGE1_APPROVED: "stage1_approved",
  STAGE1_REJECTED: "stage1_rejected",

  STAGE2_SUBMITTED: "stage2_submitted",
  STAGE2_APPROVED: "stage2_approved",
  STAGE2_REJECTED: "stage2_rejected",

  STAGE3_APPROVED: "stage3_approved",
  STAGE3_REJECTED: "stage3_rejected",

  NOTE: "note",
});

module.exports = {
  ROLES,
  STATUSES,
  HISTORY_TYPES,
};
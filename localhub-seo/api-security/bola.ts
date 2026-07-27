export type OwnershipRecord = {
  ownerId: string;
  recordId: string;
};

export function canModifyResource(authenticatedUserId: string, record: OwnershipRecord): boolean {
  return authenticatedUserId === record.ownerId;
}

export function assertOwnership(authenticatedUserId: string, record: OwnershipRecord): void {
  if (!canModifyResource(authenticatedUserId, record)) {
    throw new Error(`BOLA protection: user ${authenticatedUserId} cannot modify ${record.recordId}`);
  }
}

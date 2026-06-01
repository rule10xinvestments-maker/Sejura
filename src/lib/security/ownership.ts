export type OwnedRecord = {
  owner_id: string;
};

export function assertOwnerAccess(record: OwnedRecord | null, ownerId: string) {
  if (!record || record.owner_id !== ownerId) {
    throw new Error("Access denied for this owner.");
  }
}

export function isOwner(record: OwnedRecord | null, ownerId: string) {
  return Boolean(record && record.owner_id === ownerId);
}

import { describe, expect, it } from "vitest";
import { safeDeleteRoom } from "@/domain/rooms/service";

type QueryResult = {
  data?: unknown;
  error: Error | null;
  count?: number | null;
};

class FakeQuery {
  filters: Array<[string, unknown]> = [];

  constructor(
    private table: string,
    private operation: string,
    private state: {
      bookingCount: number;
      blockCount: number;
      propertyOwned: boolean;
      deletedRooms: string[];
      updatedRooms: Array<{ roomId: string; patch: Record<string, unknown> }>;
    },
    private patch: Record<string, unknown> = {}
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  update(patch: Record<string, unknown>) {
    return new FakeQuery(this.table, "update", this.state, patch);
  }

  delete() {
    return new FakeQuery(this.table, "delete", this.state);
  }

  async single(): Promise<QueryResult> {
    if (this.table === "properties" && this.state.propertyOwned) {
      return { data: { id: "property-1", owner_id: "owner-1" }, error: null };
    }

    return { data: null, error: new Error("not found") };
  }

  then(resolve: (value: QueryResult) => void) {
    const roomId = this.filters.find(([column]) => column === "id")?.[1];

    if (this.table === "bookings") {
      resolve({ data: null, error: null, count: this.state.bookingCount });
      return;
    }

    if (this.table === "room_blocks") {
      resolve({ data: null, error: null, count: this.state.blockCount });
      return;
    }

    if (this.table === "rooms" && this.operation === "delete") {
      this.state.deletedRooms.push(String(roomId));
      resolve({ data: null, error: null });
      return;
    }

    if (this.table === "rooms" && this.operation === "update") {
      this.state.updatedRooms.push({
        roomId: String(roomId),
        patch: this.patch
      });
      resolve({ data: null, error: null });
      return;
    }

    resolve({ data: null, error: null });
  }
}

function fakeSupabase(input?: {
  bookingCount?: number;
  blockCount?: number;
  propertyOwned?: boolean;
}) {
  const state = {
    bookingCount: input?.bookingCount ?? 0,
    blockCount: input?.blockCount ?? 0,
    propertyOwned: input?.propertyOwned ?? true,
    deletedRooms: [] as string[],
    updatedRooms: [] as Array<{ roomId: string; patch: Record<string, unknown> }>
  };

  return {
    state,
    client: {
      from: (table: string) => new FakeQuery(table, "select", state)
    } as never
  };
}

describe("safeDeleteRoom", () => {
  it("hard-deletes a room without bookings or room blocks", async () => {
    const supabase = fakeSupabase();

    await expect(
      safeDeleteRoom(supabase.client, "owner-1", "property-1", "room-1")
    ).resolves.toBe("deleted");

    expect(supabase.state.deletedRooms).toEqual(["room-1"]);
    expect(supabase.state.updatedRooms).toEqual([]);
  });

  it("archives a room with booking history instead of deleting it", async () => {
    const supabase = fakeSupabase({ bookingCount: 1 });

    await expect(
      safeDeleteRoom(supabase.client, "owner-1", "property-1", "room-1")
    ).resolves.toBe("archived");

    expect(supabase.state.deletedRooms).toEqual([]);
    expect(supabase.state.updatedRooms).toEqual([
      { roomId: "room-1", patch: { status: "inactive" } }
    ]);
  });

  it("archives a room with room blocks instead of deleting it", async () => {
    const supabase = fakeSupabase({ blockCount: 1 });

    await expect(
      safeDeleteRoom(supabase.client, "owner-1", "property-1", "room-1")
    ).resolves.toBe("archived");

    expect(supabase.state.deletedRooms).toEqual([]);
    expect(supabase.state.updatedRooms[0]).toMatchObject({
      roomId: "room-1",
      patch: { status: "inactive" }
    });
  });

  it("does not delete another owner's room", async () => {
    const supabase = fakeSupabase({ propertyOwned: false });

    await expect(
      safeDeleteRoom(supabase.client, "owner-2", "property-1", "room-1")
    ).rejects.toThrow("Proprietatea nu apartine acestui proprietar.");

    expect(supabase.state.deletedRooms).toEqual([]);
    expect(supabase.state.updatedRooms).toEqual([]);
  });
});


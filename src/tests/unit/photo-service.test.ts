import { describe, expect, it } from "vitest";
import {
  listPropertyPhotos,
  listPublicPropertyPhotos,
  listPublicRoomPhotos,
  listRoomPhotos,
  propertyCoverPhoto,
  roomCoverPhoto,
  uploadRoomPhoto
} from "@/domain/photos/service";
import type { PropertyPhoto, RoomPhoto } from "@/domain/photos/types";

function propertyPhoto(patch: Partial<PropertyPhoto>): PropertyPhoto {
  return {
    id: "property-photo-1",
    owner_id: "owner-1",
    property_id: "property-1",
    storage_path: "owner-1/property-1/property/photo.jpg",
    public_url: "signed-property-url",
    alt_text: null,
    sort_order: 0,
    is_cover: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...patch
  };
}

function roomPhoto(patch: Partial<RoomPhoto>): RoomPhoto {
  return {
    id: "room-photo-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-1",
    storage_path: "owner-1/property-1/rooms/room-1/photo.jpg",
    public_url: "signed-room-url",
    alt_text: null,
    sort_order: 0,
    is_cover: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...patch
  };
}

function fakeImageFile(patch: Partial<File> = {}) {
  return {
    name: "camera.jpg",
    type: "image/jpeg",
    size: 1024,
    ...patch
  } as File;
}

function fakeRoomOwnershipClient(roomOwned: boolean) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({
      data: roomOwned ? { id: "room-1", property_id: "property-1" } : null,
      error: roomOwned ? null : new Error("not found")
    })
  };

  return {
    from: () => chain,
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: "signed-url" }, error: null })
      })
    }
  } as never;
}

function fakeListPhotosClient(options: {
  rows: Array<PropertyPhoto | RoomPhoto>;
  failingPaths?: string[];
}) {
  const filters: Array<[string, unknown]> = [];
  const failingPaths = new Set(options.failingPaths ?? []);

  const query = {
    select: () => query,
    eq: (column: string, value: unknown) => {
      filters.push([column, value]);
      return query;
    },
    order: () => query,
    then: (
      resolve: (value: {
        data: Array<PropertyPhoto | RoomPhoto>;
        error: Error | null;
      }) => void
    ) =>
      resolve({
        data: options.rows.filter((row) =>
          filters.every(([column, value]) => row[column as keyof typeof row] === value)
        ),
        error: null
      })
  };

  return {
    filters,
    client: {
      from: () => query,
      storage: {
        from: () => ({
          createSignedUrl: async (path: string) =>
            failingPaths.has(path)
              ? { data: null, error: new Error("storage object not readable") }
              : { data: { signedUrl: `https://signed.example/${path}` }, error: null }
        })
      }
    } as never
  };
}

describe("photo service", () => {
  it("chooses the cover property photo without using room photos", () => {
    const cover = propertyPhoto({
      id: "cover",
      is_cover: true,
      public_url: "signed-cover-url"
    });

    expect(propertyCoverPhoto([propertyPhoto({ id: "first" }), cover])).toBe(cover);
  });

  it("keeps room photos associated with their own room", () => {
    const roomOneCover = roomPhoto({
      id: "room-1-cover",
      room_id: "room-1",
      is_cover: true
    });
    const otherRoomCover = roomPhoto({
      id: "room-2-cover",
      room_id: "room-2",
      is_cover: true
    });

    expect(roomCoverPhoto([roomOneCover, otherRoomCover], "room-1")).toBe(roomOneCover);
    expect(roomCoverPhoto([roomOneCover, otherRoomCover], "room-2")).toBe(otherRoomCover);
  });

  it("rejects unsafe file types before upload", async () => {
    await expect(
      uploadRoomPhoto(
        fakeRoomOwnershipClient(true),
        "owner-1",
        "property-1",
        "room-1",
        fakeImageFile({ type: "application/x-msdownload", name: "run.exe" })
      )
    ).rejects.toThrow("Fisierul trebuie sa fie jpg, jpeg, png sau webp.");
  });

  it("rejects oversized room photos before upload", async () => {
    await expect(
      uploadRoomPhoto(
        fakeRoomOwnershipClient(true),
        "owner-1",
        "property-1",
        "room-1",
        fakeImageFile({ size: 11 * 1024 * 1024 })
      )
    ).rejects.toThrow("Poza trebuie sa fie mai mica de 10 MB.");
  });

  it("does not let an owner upload to another owner's room", async () => {
    await expect(
      uploadRoomPhoto(
        fakeRoomOwnershipClient(false),
        "owner-1",
        "property-1",
        "room-2",
        fakeImageFile()
      )
    ).rejects.toThrow("Camera nu apartine acestei proprietati.");
  });

  it("loads owner property photos from private storage signed URLs", async () => {
    const { client, filters } = fakeListPhotosClient({
      rows: [
        propertyPhoto({ id: "property-photo-1" }),
        propertyPhoto({ id: "other-property-photo", property_id: "property-2" })
      ]
    });

    const photos = await listPropertyPhotos(client, "owner-1", "property-1");

    expect(filters).toEqual([
      ["owner_id", "owner-1"],
      ["property_id", "property-1"]
    ]);
    expect(photos).toHaveLength(1);
    expect(photos[0]).toMatchObject({
      id: "property-photo-1",
      public_url:
        "https://signed.example/owner-1/property-1/property/photo.jpg"
    });
  });

  it("loads owner room photos from private storage signed URLs", async () => {
    const { client, filters } = fakeListPhotosClient({
      rows: [
        roomPhoto({ id: "room-photo-1", room_id: "room-1" }),
        roomPhoto({ id: "other-property-room-photo", property_id: "property-2" })
      ]
    });

    const photos = await listRoomPhotos(client, "owner-1", "property-1");

    expect(filters).toEqual([
      ["owner_id", "owner-1"],
      ["property_id", "property-1"]
    ]);
    expect(photos).toHaveLength(1);
    expect(photos[0]).toMatchObject({
      id: "room-photo-1",
      room_id: "room-1",
      public_url:
        "https://signed.example/owner-1/property-1/rooms/room-1/photo.jpg"
    });
  });

  it("skips one missing property signed URL without failing the page load", async () => {
    const missingPath = "owner-1/property-1/property/missing.jpg";
    const { client } = fakeListPhotosClient({
      rows: [
        propertyPhoto({ id: "missing", storage_path: missingPath }),
        propertyPhoto({ id: "visible", storage_path: "owner-1/property-1/property/visible.jpg" })
      ],
      failingPaths: [missingPath]
    });

    const photos = await listPropertyPhotos(client, "owner-1", "property-1");

    expect(photos).toHaveLength(1);
    expect(photos[0].id).toBe("visible");
  });

  it("keeps room photos under their exact room after signing", async () => {
    const { client } = fakeListPhotosClient({
      rows: [
        roomPhoto({ id: "room-1-photo", room_id: "room-1" }),
        roomPhoto({
          id: "room-2-photo",
          room_id: "room-2",
          storage_path: "owner-1/property-1/rooms/room-2/photo.jpg"
        })
      ]
    });

    const photos = await listRoomPhotos(client, "owner-1", "property-1");

    expect(roomCoverPhoto(photos, "room-1")?.id).toBe("room-1-photo");
    expect(roomCoverPhoto(photos, "room-2")?.id).toBe("room-2-photo");
  });

  it("loads public property photos with signed URLs or returns a fallback list", async () => {
    const missingPath = "owner-1/property-1/property/missing.jpg";
    const { client } = fakeListPhotosClient({
      rows: [
        propertyPhoto({ id: "missing", storage_path: missingPath }),
        propertyPhoto({ id: "public-cover", storage_path: "owner-1/property-1/property/cover.jpg" }),
        propertyPhoto({ id: "other-public-cover", property_id: "property-2" })
      ],
      failingPaths: [missingPath]
    });

    const photos = await listPublicPropertyPhotos(client, "property-1");

    expect(photos).toHaveLength(1);
    expect(propertyCoverPhoto(photos)?.id).toBe("public-cover");
  });

  it("loads public room photos with signed URLs or returns an empty fallback", async () => {
    const missingPath = "owner-1/property-1/rooms/room-1/missing.jpg";
    const { client } = fakeListPhotosClient({
      rows: [roomPhoto({ id: "missing", storage_path: missingPath })],
      failingPaths: [missingPath]
    });

    const photos = await listPublicRoomPhotos(client, "property-1");

    expect(photos).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
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
});

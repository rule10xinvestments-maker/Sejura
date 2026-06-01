export type BookingNotificationPort = {
  notifyBookingPending(bookingId: string): Promise<unknown>;
  notifyBookingConfirmed(bookingId: string): Promise<unknown>;
  notifyBookingRejected(bookingId: string): Promise<unknown>;
  notifyBookingCancelled(bookingId: string): Promise<unknown>;
  notifyCalendarSyncFailed(bookingId: string): Promise<unknown>;
};

export type RoomFormState = {
  message?: string;
  errors?: {
    name?: string;
    max_guests?: string;
    base_price_per_night?: string;
    status?: string;
    form?: string;
  };
};

export class AdminAuthorizationError extends Error {
  constructor(message = "Nu ai acces la zona de administrare Sejura.") {
    super(message);
    this.name = "AdminAuthorizationError";
  }
}

export class AdminActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminActionError";
  }
}

export class HttpError extends Error {
  public readonly httpStatusCode: number;
  public readonly detail?: string;

  constructor(
    httpStatusCode: number,
    message: string,
    detail?: string,
  ) {
    super(message);

    this.httpStatusCode = httpStatusCode;
    this.detail = detail;
  }
}

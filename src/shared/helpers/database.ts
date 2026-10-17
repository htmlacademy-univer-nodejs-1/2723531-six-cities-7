export function getMongoURI(
  username: string,
  password: string,
  host: string,
  port: number,
  databaseName: string,
): string {
  const credentials = `${encodeURIComponent(username)}:${encodeURIComponent(password)}`;
  const server = `${host}:${port}`;

  return `mongodb://${credentials}@${server}/${encodeURIComponent(databaseName)}?authSource=admin`;
}

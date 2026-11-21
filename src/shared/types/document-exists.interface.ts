export interface DocumentExists {
  exists(id: string): Promise<boolean>;
}

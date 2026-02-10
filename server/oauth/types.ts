export interface PendingAuth {
  codeVerifier: string;
  redirectUri: string;
  createdAt: number;
}

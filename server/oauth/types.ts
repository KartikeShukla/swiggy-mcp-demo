export interface PendingAuth {
  codeVerifier: string;
  redirectUri: string;
  tokenEndpoint: string;
  createdAt: number;
}

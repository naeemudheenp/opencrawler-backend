export interface InterfaceJob {
  postActionApi: string | null;
  email: string;
  url: string;
  mode: string;
}
export interface InterfaceEmailTemplates {
  crawlingInitiatedEmail(): string;
  crawlingCompletedEmail(
    allPages: string[] | Set<string>,
    brokenUrl: string[] | Set<string>,
  ): string;
}

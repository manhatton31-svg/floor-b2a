export type DirectorySubmission = {
  name: string;
  url: string;
  note: string;
};

/** Demand fills this when a directory is actually submitted. Empty is honest. */
export const DIRECTORY_SUBMISSIONS: DirectorySubmission[] = [
  {
    name: "Grok Agent Store",
    url: "https://grok-agent-store.manhatton31.workers.dev/v1/agents/floor",
    note: "Submitted catalog https://floor-desk-ecru.vercel.app/api/catalog · live 2026-09-03 · slug floor · id agtpub_776d73b9a69b66c22bce",
  },
  {
    name: "LLMS Central",
    url: "https://llmscentral.com/floor-desk-ecru.vercel.app/llms.txt",
    note: "Submitted https://floor-desk-ecru.vercel.app/llms.txt · GET https://llmscentral.com/api/llms?domain=floor-desk-ecru.vercel.app 200 · 2026-09-03",
  },
  {
    name: "Zearches Software & SaaS Tools",
    url: "https://zearches.com/directory.php?slug=software-saas",
    note: "Submitted landing https://floor-desk-ecru.vercel.app · live unpaid listing · first seen stamped 2026-09-03 17:34",
  },
  {
    name: "llmstxt.info",
    url: "https://llmstxt.info/directory/?search=floor-desk-ecru.vercel.app",
    note: "Live unpaid · listed 2026-09-03 · host floor-desk-ecru.vercel.app · submitted https://floor-desk-ecru.vercel.app/llms.txt",
  },
];

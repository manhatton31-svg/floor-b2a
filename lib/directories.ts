export type DirectorySubmission = {
  name: string;
  url: string;
  note: string;
};

/** Demand fills this when a directory is actually submitted. Empty is honest. */
export const DIRECTORY_SUBMISSIONS: DirectorySubmission[] = [];

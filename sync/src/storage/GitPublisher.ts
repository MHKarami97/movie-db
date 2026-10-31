import { execFileSync } from 'node:child_process';

export class GitPublisher {
  private repoDir: string;

  constructor(repoDir: string) {
    this.repoDir = repoDir;
  }

  public publish(dateIso = new Date().toISOString().split('T')[0]): { changed: boolean; message: string } {
    try {
      this.runGit(['add', '-A']);

      // Check if there are staged changes
      try {
        this.runGit(['diff', '--cached', '--quiet']);
        return { changed: false, message: 'No data changes detected. Skipping commit and push.' };
      } catch {
        // diff returned exit code 1, which means there are staged differences
      }

      const commitMessage = `data: sync TMDB catalog [${dateIso}]`;
      let hasCommit = false;

      try {
        this.runGit(['rev-parse', '--verify', 'HEAD']);
        hasCommit = true;
      } catch {
        hasCommit = false;
      }

      if (hasCommit) {
        this.runGit(['commit', '--amend', '-m', commitMessage]);
      } else {
        this.runGit(['commit', '-m', commitMessage]);
      }

      this.runGit(['push', 'origin', 'data', '--force-with-lease']);

      return {
        changed: true,
        message: `Successfully amended data branch commit and pushed with --force-with-lease.`
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`GitPublisher error: ${errorMsg}`);
    }
  }

  private runGit(args: string[]): string {
    return execFileSync('git', args, {
      cwd: this.repoDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }
}

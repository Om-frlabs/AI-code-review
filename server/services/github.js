// GitHub API service — fetches PR diffs and metadata
// SECURITY: Never log or persist GitHub tokens

/**
 * Structured diff output shape:
 * {
 *   pr: { title, author, description, url, number },
 *   files: [
 *     {
 *       filename: string,
 *       status: 'added' | 'modified' | 'removed' | 'renamed',
 *       additions: number,
 *       deletions: number,
 *       patch: string (unified diff for this file)
 *     }
 *   ],
 *   rawDiff: string (full unified diff)
 * }
 */

export async function fetchPRData(owner, repo, pullNumber, token) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'AI-Code-Review-Dashboard',
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  // Fetch PR metadata
  const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
    headers,
  });

  if (!prRes.ok) {
    const errBody = await prRes.text();
    if (prRes.status === 404) {
      throw new Error(`PR #${pullNumber} not found in ${owner}/${repo}. Check the repo name and PR number.`);
    }
    if (prRes.status === 401 || prRes.status === 403) {
      throw new Error('GitHub authentication failed. Check your token or ensure the repo is public.');
    }
    throw new Error(`GitHub API error (${prRes.status}): ${errBody}`);
  }

  const prData = await prRes.json();

  // Fetch PR files (with patches)
  const filesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`, {
    headers,
  });

  if (!filesRes.ok) {
    throw new Error(`Failed to fetch PR files: ${filesRes.status}`);
  }

  const filesData = await filesRes.json();

  // Fetch raw unified diff
  const diffRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
    headers: { ...headers, Accept: 'application/vnd.github.v3.diff' },
  });

  const rawDiff = diffRes.ok ? await diffRes.text() : '';

  return {
    pr: {
      title: prData.title,
      author: prData.user?.login || 'unknown',
      description: prData.body || '',
      url: prData.html_url,
      number: prData.number,
      base: prData.base?.ref || 'main',
      head: prData.head?.ref || 'feature',
      state: prData.state,
      additions: prData.additions,
      deletions: prData.deletions,
      changedFiles: prData.changed_files,
    },
    files: filesData.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch || '',
    })),
    rawDiff,
  };
}

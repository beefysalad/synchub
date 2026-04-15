export function assertRepositoryInput(owner?: string | null, repo?: string | null) {
  if (!owner || !repo) {
    throw new Error('Both "owner" and "repo" are required.')
  }
}

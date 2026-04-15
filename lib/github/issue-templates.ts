export const issueTemplates = {
  feature: {
    label: 'Feature request',
    titlePrefix: 'Feature: ',
    description: 'Capture a new product capability with a clear user value.',
    body: `## Summary

What should happen?

## Why it matters

Who benefits and what problem does this solve?

## Proposed approach

- 
- 
- 

## Notes

Anything else the team should know?`,
  },
  bug: {
    label: 'Bug report',
    titlePrefix: 'Bug: ',
    description: 'Document a broken experience with steps and expected behavior.',
    body: `## Summary

What is going wrong?

## Steps to reproduce

1. 
2. 
3. 

## Expected behavior

What should happen instead?

## Actual behavior

What happens today?

## Environment

- Browser / device:
- App version:
`,
  },
  task: {
    label: 'Task',
    titlePrefix: 'Task: ',
    description: 'Track an internal task, cleanup, or follow-up item.',
    body: `## Summary

What needs to get done?

## Scope

- 
- 
- 

## Definition of done

- 
- 
- 
`,
  },
} as const

export type GitHubIssueTemplate = keyof typeof issueTemplates

export const defaultGitHubIssueTemplate: GitHubIssueTemplate = 'feature'

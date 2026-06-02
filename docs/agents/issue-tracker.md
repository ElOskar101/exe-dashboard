# Issue tracker: GitHub

Issues for this repo live in GitHub Issues. Use the `gh` CLI for issue and PRD workflows.

## Conventions

- Create an issue: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- Read an issue: `gh issue view <number> --comments`, and include labels when you are triaging.
- List issues: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`
- Comment on an issue: `gh issue comment <number> --body "..."`
- Apply or remove labels: `gh issue edit <number> --add-label "..."` and `--remove-label "..."`
- Close an issue: `gh issue close <number> --comment "..."`

Infer the repository from `git remote -v`; `gh` does this automatically inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

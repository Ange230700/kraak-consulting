---
applyTo: '**/*'
---

These are some guidelines when using the SonarQube MCP server.

# Important Tool Guidelines

## Basic usage

- **IMPORTANT**: At the start of a task, disable automatic analysis with toggle_automatic_analysis if the tool exists.
- **IMPORTANT**: After finishing code generation or code edits, call analyze_file_list if the tool exists and analyze every file you created or modified.
- **IMPORTANT**: After this final analysis, re-enable automatic analysis with toggle_automatic_analysis if the tool exists.

## Project Keys

- When a user mentions a project key, call search_my_sonarqube_projects first to identify the exact key.
- Never guess project keys. Always look them up.

## Code Language Detection

- When analyzing snippets, detect the language from syntax when possible.
- If the language is unclear, ask the user or make a clearly stated best-effort guess.

## Branch and Pull Request Context

- Many operations support branch-specific analysis.
- If the user mentions a feature branch, include the branch parameter.

## Code Issues and Violations

- After fixing issues, do not verify with search_sonar_issues_in_projects immediately, because server results may not yet reflect recent updates.

# Common Troubleshooting

## Authentication Issues

- SonarQube requires USER tokens, not project tokens.
- If you see "SonarQube answered with Not authorized", verify the token type first.

## Project Not Found

- Use search_my_sonarqube_projects to list available projects.
- Verify project key spelling and format.

## Code Analysis Issues

- Ensure the programming language is correctly specified.
- Remind users that snippet analysis does not replace full project scans.
- Provide full file content when possible for better analysis results.

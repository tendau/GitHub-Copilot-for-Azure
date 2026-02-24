# Agent Observability Loop

Orchestrate the full eval-driven optimization cycle for a Foundry agent: deploy → evaluate → analyze failures → optimize prompt → re-deploy → compare versions → iterate.

## Quick Reference

| Property | Value |
|----------|-------|
| MCP server | `foundry-mcp` |
| Key MCP tools | `evaluation_agent_batch_eval_create`, `evaluator_catalog_create`, `evaluation_comparison_create`, `prompt_optimize`, `agent_update` |
| Prerequisite | Agent deployed and running (use [deploy skill](../deploy/deploy.md)) |

## Entry Points

| User Intent | Start At |
|-------------|----------|
| "Deploy and evaluate my agent" | [Step 1: Deploy & Setup](references/deploy-and-setup.md) |
| "Evaluate my agent" / "Run an eval" | [Step 2: Evaluate](references/evaluate-step.md) |
| "Why did my eval fail?" / "Analyze results" | [Step 3: Analyze](references/analyze-results.md) |
| "Improve my agent" / "Optimize prompt" | [Step 4: Optimize](references/optimize-deploy.md) |
| "Compare agent versions" | [Step 5: Compare](references/compare-iterate.md) |
| "Set up CI/CD evals" | [Step 6: CI/CD](references/cicd-monitoring.md) |

## Before Starting — Detect Current State

1. Check `.env` for `AZURE_AI_PROJECT_ENDPOINT` and `AZURE_AI_AGENT_NAME`
2. Use `agent_get` and `agent_container_status_get` to verify the agent exists and is running
3. Use `evaluation_get` to check for existing eval runs
4. Jump to the appropriate entry point

## Loop Overview

```
Deploy → Setup evaluators & dataset
  → Evaluate (batch eval run)
  → Download & cluster failures
  → Pick category → Optimize prompt
  → Deploy new version → Re-evaluate
  → Compare versions → Iterate or finish
  → Enable CI/CD evals & monitoring
```

## Behavioral Rules

1. **Auto-poll in background.** After creating eval runs or starting containers, poll in a background terminal. Only surface the final result.
2. **Confirm before changes.** Show diff/summary before modifying agent code or deploying. Wait for sign-off.
3. **Prompt for next steps.** After each step, present options. Never assume the path forward.
4. **Write scripts to files.** Python scripts go in `scripts/` — no inline code blocks.
5. **Persist eval artifacts.** Save to `evaluators/`, `datasets/`, and `results/` for version tracking (see [deploy-and-setup](references/deploy-and-setup.md) for structure).

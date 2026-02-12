---
name: agent-framework
description: |
  Evaluate AI agents and workflows built with Microsoft Agent Framework using pytest-agent-evals plugin. Supports built-in and custom evaluators with VS Code Test Explorer integration.
  USE FOR: evaluate agent, test agent, assess agent, agent evaluation, pytest evaluation, measure agent performance, agent quality, add evaluator, evaluation dataset, judge model.
  DO NOT USE FOR: creating agents (use agent/create), deploying agents (use agent/deploy), evaluating non-Agent-Framework agents.
---

# Evaluate Agent with pytest-agent-evals

Assess agent performance using the `pytest-agent-evals` plugin — a pytest-based evaluation framework integrated with VS Code Test Explorer and AI Toolkit.

> **Prerequisite**: The agent under test MUST be built with Microsoft Agent Framework (`agent_framework.ChatAgent` or `agent_framework.WorkflowAgent`). If not, inform user and skip evaluation.

## Quick Reference

| Property | Value |
|----------|-------|
| **Plugin** | pytest-agent-evals (>=0.0.1b260210) |
| **Framework** | pytest |
| **Agent SDK** | Microsoft Agent Framework (ChatAgent, WorkflowAgent) |
| **Integration** | VS Code Test Explorer, AI Toolkit |
| **Best For** | Systematic agent evaluation with built-in and custom evaluators |

## When to Use This Skill

Use when the user wants to:

- **Evaluate** or test an existing agent's performance
- **Set up** systematic evaluation with metrics
- **Add** built-in or custom evaluators
- **Generate** evaluation test dataset
- **Configure** judge model for prompt-based evaluation

## Defaults

- **Plugin**: pytest-agent-evals (pin version `>=0.0.1b260210`)
- **Environment**: Reuse agent's existing virtual environment

## MCP Tools

This skill delegates to `microsoft-foundry` MCP tools for model and project operations:

| Tool | Purpose |
|------|---------|
| `foundry_models_list` | Browse model catalog for judge model selection |
| `foundry_models_deployments_list` | List deployed models for judge model |
| `foundry_resource_get` | Get project endpoint |

## Evaluation Workflow

```markdown
Evaluation Setup:
- [ ] Clarify evaluation metrics
- [ ] Obtain test dataset (file or generate)
- [ ] Resolve judge model (if needed)
- [ ] Generate evaluation code
- [ ] Set up project configuration
- [ ] Install dependencies
- [ ] Verify & Handoff
```

### Step 1: Clarify Metrics

Analyze user's app and suggest 1-3 relevant metrics:

```
Based on your [agent type], I recommend:
- [Metric 1]: [Brief description]
- [Metric 2]: [Brief description]

Should I proceed with these metrics?
```

**Guidelines:**
- If user specifies objectives (e.g., "evaluate tool accuracy") → suggest only relevant metrics
- If general request ("evaluate my agent") → suggest max 3 most important
- Match metric count to explicitly mentioned objectives

### Step 2: Obtain Test Dataset

```
How would you like to provide test queries?
1. Point to existing JSONL file
2. Let me generate sample queries
```

**Dataset format** — JSONL with required `query` field and optional `id`:
```jsonl
{"id": "weather_ny", "query": "What's the weather in New York?"}
{"id": "time_utc", "query": "What's the current UTC time?"}
```

If generating, create 5-10 realistic queries and save to `<agent_name>_dataset.jsonl`.

### Step 3: Resolve Judge Model (if needed)

A judge model is only required when the selected metrics include **prompt-based** evaluators (see Type column in [Built-in Evaluators](#built-in-evaluators)) or Custom Prompt Evaluators. If all metrics are code-based or Custom Code Evaluators only, skip this step.

**Default (silent)**: Use the agent's own Foundry model deployment (`FOUNDRY_MODEL_DEPLOYMENT_NAME`). Do NOT ask the user.

**Unsupported models** — cannot produce structured evaluation output:
- **Reasoning models**: DeepSeek R-series, OpenAI o-series (e.g., `o1`, `o3`, `o4-mini`)
- **OpenAI gpt-5 series** (excluding `gpt-5-chat` variants which ARE supported)

**If the agent's model is unsupported**: Use `microsoft-foundry` skill's model catalog to help the user select and deploy a suitable judge model.

### Step 4: Confirm and Generate

```
Evaluation Plan:
- Metrics: [list]
- Dataset: [source]
- Agent: [agent fixture/file]
- Judge Model: [deployment name] (auto-selected / user-selected)

Proceed to generate evaluation code?
```

### Step 5: Generate Evaluation Code

Use the `pytest-agent-evals` plugin to write test-suite-style evaluation code.

#### Complete Example

```python
import os
import pytest
from pytest_agent_evals import (
    evals,
    EvaluatorResults,
    AzureOpenAIModelConfig,
    ChatAgentConfig,
    BuiltInEvaluatorConfig,
)
from dotenv import load_dotenv
from my_agent import create_my_agent  # Import the agent from user's source code

load_dotenv()
project_endpoint = os.getenv("FOUNDRY_PROJECT_ENDPOINT")
model_deployment = os.getenv("FOUNDRY_MODEL_DEPLOYMENT_NAME")
# Azure OpenAI endpoint derived from the Foundry resource
# Format: https://<resource>.openai.azure.com/
azure_openai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

# --- Agent Fixture ---
# The plugin calls this fixture to get the agent instance for testing.
@pytest.fixture
def my_agent():
    return create_my_agent(project_endpoint, model_deployment)

# --- Evaluation Suite ---
# Judge model uses Azure OpenAI endpoint format (not Foundry project endpoint).
@evals.dataset("my_agent_dataset.jsonl")
@evals.judge_model(AzureOpenAIModelConfig(deployment_name=model_deployment, endpoint=azure_openai_endpoint))
@evals.agent(ChatAgentConfig(my_agent))
class TestMyAgent:

    @evals.evaluator(BuiltInEvaluatorConfig("task_adherence"))
    def test_task_adherence(self, evaluator_results: EvaluatorResults):
        assert evaluator_results.task_adherence.result == "pass"

    @evals.evaluator(BuiltInEvaluatorConfig("relevance"))
    def test_relevance(self, evaluator_results: EvaluatorResults):
        assert evaluator_results.relevance.result == "pass"
```

#### Key Concepts

1. **Agent Fixture**: A `@pytest.fixture` that returns an initialized `ChatAgent` or `WorkflowAgent` instance. Referenced via `ChatAgentConfig(agent_fixture)`.
2. **Dataset**: `@evals.dataset("file.jsonl")` — JSONL file with `query` (required) and `id` (optional) fields.
3. **Judge Model**: `@evals.judge_model(AzureOpenAIModelConfig(...))` — LLM used for AI-assisted (prompt-based) evaluation. The endpoint must be in Azure OpenAI format (`https://<resource>.openai.azure.com/`), not Foundry project endpoint format.
4. **Evaluators**: `@evals.evaluator(...)` on each test method — registers an evaluator that runs against the agent's response.
5. **Results**: Access via `evaluator_results.<name>.result` (returns `"pass"` or `"fail"`) and `evaluator_results.<name>.score`.

#### Code Generation Guidelines

- **File naming**: `test_<agent_name>.py`
- **Class naming**: `Test<AgentName>` (must start with `Test`)
- **Test naming**: `test_<metric_name>` (must start with `test_`)
- **One evaluator per test method** — each `@evals.evaluator` maps to one test
- **Import the agent** from the user's source code and wrap in a `@pytest.fixture`. Always reuse the existing agent definition to keep a single source of truth — if the agent is updated, the evaluation automatically tests the updated version. If the agent cannot be directly imported (e.g., it's created inline in a `main()` function), perform a simple refactor: extract the agent creation into a standalone function or module-level variable in the user's source code, then import it in the test file
- **Judge model endpoint**: Must use Azure OpenAI endpoint format (`https://<resource>.openai.azure.com/`). The Foundry project endpoint (`https://<resource>.services.ai.azure.com/api/projects/<project>`) will NOT work for the judge model. Add `AZURE_OPENAI_ENDPOINT` to `.env`.
- **Judge model selection**: By default, reuse the agent's model deployment silently. Only if the model is unsupported (reasoning models, gpt-5 non-chat), use a separate env var (e.g., `JUDGE_MODEL_DEPLOYMENT_NAME`) and use `microsoft-foundry` skill's model catalog to select a supported model.
- Ensure `.env` contains `FOUNDRY_PROJECT_ENDPOINT`, `FOUNDRY_MODEL_DEPLOYMENT_NAME` (reuse from agent creation), and `AZURE_OPENAI_ENDPOINT` (for judge model)

### Step 6: Set Up Project

#### Install Dependencies

```bash
pip install pytest-agent-evals>=0.0.1b260210 --pre
```

#### .vscode/settings.json

Create or update `.vscode/settings.json` to enable VS Code Test Explorer integration:

```jsonc
{
    "python.testing.pytestArgs": [
        ".",
        "--cache-mode=session"
    ],
    "python.testing.pytestEnabled": true
}
```

> `--cache-mode=session` clears response cache at startup for consistency. Use `--cache-mode=persistence` to preserve cache across sessions for rapid evaluator tuning.

#### Verify

If the required model environment variables are not yet configured (e.g., `.env` values are empty or placeholders), skip verification and inform the user to set the environment variables before running tests.

Run **all evaluators with a single test case** to verify the setup and all evaluators work well without waiting for the full dataset:

```bash
pytest test_<agent_name>.py -k "<first_test_case_id>" -v
```

For example, if the test class is `TestWeatherAgent` and the first dataset entry has id `weather_ny`:
```bash
pytest test_weather_agent.py -k "weather_ny" -v
```

After the test runs successfully, the plugin saves results to `test-results/evaluation_results_<timestamp>.json`. The result file schema:

```json
{
  "rows": [
    {
      "inputs.query": "user query",
      "outputs.response": "agent response",
      "outputs.tool_calls": "tool calls made by agent",
      "outputs.tool_definitions": "tool definitions available to agent",
      "outputs.<evaluator_name>.score": 5,
      "outputs.<evaluator_name>.reason": "explanation of score",
      "outputs.<evaluator_name>.result": "pass"
    }
  ]
}
```

Each row is a test case result containing the query, agent response, and all evaluators' scores/reasons/results. Read the latest result file, analyze it briefly, and report to the user:
- Whether the test passed or failed
- The evaluator score and reason (if available)
- Any issues to address

If the test fails due to code/setup errors, fix and rerun.

> For the full evaluation, the user can run `pytest test_<agent_name>.py -v` or use VS Code Test Explorer (recommended) — tests appear in the sidebar and results integrate with AI Toolkit.

### Step 7: Generate Evaluation Documentation

Create a `evaluation.md` in the project root with the following sections:

**Setup**: Environment variables needed in `.env` (with placeholder values), install command (`pip install pytest-agent-evals>=0.0.1b260210 --pre`), VS Code settings for Test Explorer.

**Run Evaluations**: VS Code Test Explorer (recommended) — Open Testing panel (flask icon) → click ▶️ to run all or individual tests. Terminal — `pytest test_<agent_name>.py -v`.

**View Results**: Results saved to `test-results/evaluation_results_<timestamp>.json` after each run. Open in **AI Toolkit** panel → **Local Evaluation Results** to browse.

**Update Test Dataset**: Open JSONL dataset file → click **"Generate Test Cases with Copilot"** CodeLens.

**Update Custom Evaluators**: Click **"+ Add Custom Evaluator with Copilot"** CodeLens above test class, or **"Update Custom Evaluator with Copilot"** above a test method.

After generating the documentation, inform the user they can follow `evaluation.md` to run full evaluations, update the test dataset, and add or update custom evaluators.

## Built-in Evaluators

Use `BuiltInEvaluatorConfig(name, threshold)` in `@evals.evaluator(...)`.

### Agent Evaluators

| Evaluator | Type | Description |
|-----------|------|-------------|
| `task_adherence` | Prompt-based | Assesses how well an AI-generated response follows the assigned task based on alignment with instructions and definitions, accuracy and clarity of the response, and proper use of provided tool definitions. |
| `intent_resolution` | Prompt-based | Assesses whether the user intent was correctly identified and resolved. |
| `tool_call_accuracy` | Prompt-based | Assesses how accurately an AI uses tools by examining relevance to the conversation, parameter correctness according to tool definitions, and parameter value extraction from the conversation. |
| `tool_selection` | Prompt-based | Evaluates whether an AI agent selected the most appropriate and efficient tools for a given task, avoiding redundancy or missing essentials. |
| `task_completion` | Prompt-based | Evaluates whether an AI agent successfully completed the requested task end to end by analyzing the conversation history and agent response to determine if all task requirements were met. |
| `tool_call_success` | Prompt-based | Evaluates whether all tool calls were successful or not. Checks all tool calls to determine if any resulted in technical failure like exception, error, or timeout. |
| `tool_input_accuracy` | Prompt-based | Checks whether all parameters in an agent's tool call are correct, validating grounding, type, format, completeness, and contextual appropriateness. |
| `tool_output_utilization` | Prompt-based | Checks if an agent correctly interprets and contextually uses the outputs returned by invoked tools without fabrication or omission. |

### General Purpose

| Evaluator | Type | Description |
|-----------|------|-------------|
| `coherence` | Prompt-based | Assesses the ability of the language model to generate text that reads naturally, flows smoothly, and resembles human-like language. |
| `fluency` | Prompt-based | Assesses the extent to which the generated text conforms to grammatical rules, syntactic structures, and appropriate vocabulary usage. |
| `relevance` | Prompt-based | Assesses the ability of answers to capture the key points of the context and produce coherent and contextually appropriate outputs. |

### RAG Evaluators

| Evaluator | Type | Description | Dataset Fields |
|-----------|------|-------------|----------------|
| `groundedness` | Prompt-based | Assesses the correspondence between claims in an AI-generated answer and the source context, making sure that these claims are substantiated by the context. | `context` |
| `retrieval` | Prompt-based | Assesses the AI system's performance in retrieving information for additional context (e.g. a RAG scenario). | `context` |
| `response_completeness` | Prompt-based | Assesses how thoroughly an AI model's generated response aligns with the key information, claims, and statements established in the ground truth. | `ground_truth` |

### Similarity Evaluators

| Evaluator | Type | Description | Dataset Fields |
|-----------|------|-------------|----------------|
| `similarity` | Code-based | Evaluates the likeness between a ground truth sentence and the AI model's generated prediction using sentence-level embeddings. | `ground_truth` |
| `f1_score` | Code-based | Calculates F1 score. | `ground_truth` |
| `bleu_score` | Code-based | Calculates BLEU score. | `ground_truth` |

> **Dataset Fields**: Additional columns required in the JSONL dataset beyond `query`. The plugin auto-extracts `response`, `tool_calls`, and `tool_definitions` from the agent.

## Custom Evaluators

For metrics not covered by built-in evaluators, define custom evaluators.

### Custom Prompt Evaluator (LLM Judge)

Use `CustomPromptEvaluatorConfig` to define an LLM-based evaluator with a Jinja2 prompt template.

```python
from pytest_agent_evals import CustomPromptEvaluatorConfig

friendliness_prompt = """
You are an AI assistant that evaluates the tone of a response.
Score the response on a scale of 1 to 5, where 1 is hostile/rude and 5 is very friendly.
Provide a brief reason for your score.

Input:
Query: {{query}}
Response: {{response}}

You must output your result in the following JSON format:
{
    "result": <integer from 1 to 5>,
    "reason": "<brief explanation>"
}
"""

@evals.evaluator(CustomPromptEvaluatorConfig(name="friendliness", prompt=friendliness_prompt, threshold=4))
def test_friendliness(self, evaluator_results: EvaluatorResults):
    assert evaluator_results.friendliness.result == "pass"
```

**Template variables**: `{{query}}`, `{{response}}`, `{{tool_calls}}`, `{{tool_definitions}}`, `{{context}}`, `{{ground_truth}}`, and any other dataset columns.

**Output format**: The prompt must instruct the LLM to output JSON with `"result"` (int, float, or bool) and `"reason"` (string).

**Threshold types**:
- `int` — ordinal scale (e.g., 1-5). Pass if score >= threshold.
- `float` — continuous scale (e.g., 0.0-1.0). Pass if score >= threshold.
- `bool` — boolean. Pass if returned boolean matches threshold.

### Custom Code Evaluator (Python Function)

Use `CustomCodeEvaluatorConfig` for deterministic or rule-based grading.

```python
from pytest_agent_evals import CustomCodeEvaluatorConfig

def length_check(sample, item):
    """Pass if response is shorter than 100 characters."""
    return 1.0 if len(sample["output_text"]) < 100 else 0.0

@evals.evaluator(CustomCodeEvaluatorConfig(name="length_check", grader=length_check, threshold=0.9))
def test_length_check(self, evaluator_results: EvaluatorResults):
    assert evaluator_results.length_check.result == "pass"
```

**Grader function signature**:
```python
def grade(sample: dict[str, Any], item: dict[str, Any]) -> float:
    # sample: {"output_text": str, "tool_calls": list, "tool_definitions": list}
    # item: dataset row (e.g., {"query": str, "context": str, ...})
    return score  # float, 0.0 to 1.0
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Agent not Agent Framework | Wrong SDK | Inform user; evaluation requires Agent Framework |
| Judge model unsupported | Reasoning/non-chat model | Use `microsoft-foundry` skill to select a supported model |
| Missing env vars | `.env` not configured | Set `FOUNDRY_PROJECT_ENDPOINT`, `FOUNDRY_MODEL_DEPLOYMENT_NAME`, `AZURE_OPENAI_ENDPOINT` |
| pytest not found | Plugin not installed | `pip install pytest-agent-evals>=0.0.1b260210 --pre` |
| Import error | Agent not importable | Refactor agent creation into importable function |

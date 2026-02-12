/**
 * Unit Tests for agent-framework (evaluate)
 * 
 * Test isolated skill logic and validation rules.
 */

import { loadSkill, LoadedSkill } from "../../../../utils/skill-loader";

const SKILL_NAME = "microsoft-foundry/agent/evaluate/agent-framework";

describe("agent-framework (evaluate) - Unit Tests", () => {
  let skill: LoadedSkill;

  beforeAll(async () => {
    skill = await loadSkill(SKILL_NAME);
  });

  describe("Skill Metadata", () => {
    test("has valid SKILL.md with required fields", () => {
      expect(skill.metadata).toBeDefined();
      expect(skill.metadata.name).toBe("agent-framework");
      expect(skill.metadata.description).toBeDefined();
      expect(skill.metadata.description.length).toBeGreaterThan(10);
    });

    test("description is appropriately sized", () => {
      expect(skill.metadata.description.length).toBeGreaterThan(150);
      expect(skill.metadata.description.length).toBeLessThan(1024);
    });

    test("description contains USE FOR triggers", () => {
      expect(skill.metadata.description).toMatch(/USE FOR:/i);
    });

    test("description contains DO NOT USE FOR anti-triggers", () => {
      expect(skill.metadata.description).toMatch(/DO NOT USE FOR:/i);
    });
  });

  describe("Skill Content", () => {
    test("has substantive content", () => {
      expect(skill.content).toBeDefined();
      expect(skill.content.length).toBeGreaterThan(100);
    });

    test("contains expected sections", () => {
      expect(skill.content).toContain("## Quick Reference");
      expect(skill.content).toContain("## When to Use This Skill");
      expect(skill.content).toContain("## Evaluation Workflow");
    });

    test("contains built-in evaluators section", () => {
      expect(skill.content).toContain("## Built-in Evaluators");
      expect(skill.content).toContain("task_adherence");
      expect(skill.content).toContain("intent_resolution");
      expect(skill.content).toContain("tool_call_accuracy");
    });

    test("contains custom evaluators section", () => {
      expect(skill.content).toContain("## Custom Evaluators");
      expect(skill.content).toContain("CustomPromptEvaluatorConfig");
      expect(skill.content).toContain("CustomCodeEvaluatorConfig");
    });

    test("contains error handling section", () => {
      expect(skill.content).toContain("## Error Handling");
    });

    test("documents MCP tools", () => {
      expect(skill.content).toContain("foundry_models_list");
      expect(skill.content).toContain("foundry_models_deployments_list");
      expect(skill.content).toContain("foundry_resource_get");
    });

    test("specifies plugin version", () => {
      expect(skill.content).toContain("pytest-agent-evals");
      expect(skill.content).toContain("0.0.1b260210");
    });

    test("documents evaluation result schema", () => {
      expect(skill.content).toContain("inputs.query");
      expect(skill.content).toContain("outputs.response");
      expect(skill.content).toContain("test-results/evaluation_results_");
    });

    test("references microsoft-foundry skill for model selection", () => {
      expect(skill.content).toContain("microsoft-foundry");
    });

    test("documents judge model configuration", () => {
      expect(skill.content).toContain("AzureOpenAIModelConfig");
      expect(skill.content).toContain("AZURE_OPENAI_ENDPOINT");
      expect(skill.content).toContain("FOUNDRY_MODEL_DEPLOYMENT_NAME");
    });
  });
});

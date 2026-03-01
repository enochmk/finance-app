# Agents & AI Integration Notes

This document contains notes, guidelines, and considerations for using AI agents
or automation tools within the project.

## 🧠 Purpose

The goal of introducing agents is to assist with repetitive tasks, code
scaffolding, testing workflows, or documentation. Agents may be powered by
GPT-style models, shell scripting, or other automation technologies.

## ✅ Recommended Uses

- **Generating boilerplate** for new components, endpoints, or database
  models.
- **Writing documentation** (e.g., README updates, API docs, requirement
  prompts).
- **Creating tests** based on existing functions or routes.
- **Refactoring suggestions** – asking an agent to propose more idiomatic code
  or identify potential improvements.

## ⚠️ Cautionary Notes

- Always **review the output** carefully. Agents can introduce subtle bugs or
  security issues if used blindly.
- Avoid storing **secrets or sensitive data** in prompts or agent responses.
- Maintain version control; do not commit generated code without human
  verification.

## 🛠 How to Invoke

Designate agent tasks clearly in the `prompts/` directory. Use descriptive
filenames such as `prompt_<task>.md` to keep track of intents. When running
agents locally, ensure the environment has necessary APIs and credentials
configured.

## 📚 Resources

- Documentation on the specific AI provider (e.g., OpenAI, Azure OpenAI,
  etc.)
- Internal style guide for code formatting and testing

> Agents are tools — treat their suggestions as drafts, not final code.

---

_Last updated: March 1, 2026_

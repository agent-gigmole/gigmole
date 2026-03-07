# CLAUDE.md

## ⚠️ CHECKPOINT — 每完成一步必须执行（不可跳过）

**完成任何代码修改、调试、或决策后，立即派后台 agent 更新 memory，再做下一步。**

### 执行方式：用 Agent 工具 `run_in_background: true` 派出后台 agent

```yaml
Agent(
  subagent_type: "general-purpose",
  run_in_background: true,
  prompt: "你是 memory writer。根据以下完成情况更新 memory 文件：
    【这一步做了什么：...】
    【关键发现/坑点：...】

    必须执行：
    1. 覆盖 memory/STATE.md → 写入当前状态
    2. 追加 memory/LOG.md → 一条记录（日期 + 做了什么 + 结果）
    3. 更新 memory/TASK.md → 勾选已完成步骤
    4. 如有坑点/技巧 → 写入 memory/KNOWLEDGE/*.md + INDEX.md
    5. git add memory/ → git commit -m 'memory: 简要描述'
  "
)
```

### 纪律

- **完成一步派一次** — 不攒着批量写
- **说"我会更新"但没有派 agent = 违规**
- 代码文件单独 commit，memory 由后台 agent commit
- 会话即将结束时：确保后台 agent 已完成，STATE.md + LOG.md 已 commit

---

## Mandatory Workflow

- Before any work: read memory/PROJECT.md, memory/STATE.md, memory/TASK.md, memory/LOG.md
- Also consult memory/KNOWLEDGE/INDEX.md for project-specific tips/links.
- Follow TDD: tests first → minimal implementation → refactor → checkpoint.

## Knowledge Capture Rule

当发现任何"以后会再用到的技巧/坑/链接"，在 checkpoint 时一并告知后台 agent 写入 memory/KNOWLEDGE/ 对应文件 + INDEX.md。

## Project Config

- See project.config.yml for commands, entry points, and success criteria.

## Reusable Framework

- Follow engineering rules in /Users/qingtong/project/agentkit/FRAMEWORK.md
- Follow work cadence in /Users/qingtong/project/agentkit/WORKFLOW.md

## Skill 接管规则

当 Skill（如 guorn-backtest、feature-dev 等）接管工作流时，Skill 自身不包含 memory 更新逻辑。**Skill 执行完毕后，仍需执行 CHECKPOINT。** 不因 Skill 接管而跳过 memory 更新。

## Project-Specific Rules

- 所有 API 必须是 RESTful 风格，资源命名用复数（/tasks, /agents, /bids）
- Agent 身份通过 API Key 认证（Bearer token），每个注册 Agent 分配唯一 api_key
- 任务状态机必须严格遵守：open → awarded → in_progress → submitted → accepted/rejected/disputed
- 禁止在 API route 层直接写业务逻辑，复杂逻辑放 src/lib/services/
- 金额字段统一用 USDC lamports（整数），前端显示时 / 1_000_000
- Solana 交互通过 src/lib/solana/ 封装，不在路由层直接调用 @solana/web3.js

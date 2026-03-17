# CLAUDE.md

## ⚠️ CHECKPOINT — 每完成一步必须执行（不可跳过）

**完成任何代码修改、调试、或决策后，立即派后台 agent 更新 memory + 提炼评估，再做下一步。**

### 执行方式：用 Agent 工具 `run_in_background: true` 派出后台 agent

```yaml
Agent(
  subagent_type: "general-purpose",
  run_in_background: true,
  prompt: "你是 memory writer + refiner。
    先读取 ~/.config/agentkit/config 获取 AGENTKIT_ROOT 的值。

    根据以下完成情况：
    【这一步做了什么：...】
    【关键发现/坑点：...】

    === 第一阶段：项目 memory 更新（在项目仓库执行）===
    1. 覆盖 memory/STATE.md → 写入当前状态
    2. 追加 memory/LOG.md → 一条记录（日期 + 做了什么 + 结果）
    3. 更新 memory/TASK.md → 勾选已完成步骤
    4. 如有坑点/技巧 → 写入 memory/KNOWLEDGE/*.md + INDEX.md
    5. git add memory/ → git commit -m 'memory: 简要描述'

    === 第二阶段：提炼评估 ===
    IF 步骤 4 没有写入新的 KNOWLEDGE 内容 → 跳过第二阶段，结束。
    ELSE：
    6. 读取 $AGENTKIT_ROOT/shared/PROMOTION_LOG.md
    7. 对步骤 4 中每条新经验评估：
       - 是否可泛化（适用于其他项目）？否 → 跳过
       - PROMOTION_LOG 中是否已有类似候选/已晋升记录？
         - 无 → 在 PROMOTION_LOG.md 追加[候选]记录
         - 有 → 执行晋升：
           a. 读取目标 shared 文件，追加新内容
           b. 如无匹配目标文件且满足新建条件（见 WORKFLOW.md CHECKPOINT 提炼阶段）→ 按格式规范创建新文件
           c. 更新对应 INDEX.md（如有新建）
           d. 在 PROMOTION_LOG.md 追加[已晋升]或[新建]记录
    8. IF 步骤 7 有任何文件变更：
       git -C $AGENTKIT_ROOT add shared/
       - 如仅追加候选 → git -C $AGENTKIT_ROOT commit -m 'memory: 提炼候选 - 简要描述'
       - 如执行了晋升/新建 → git -C $AGENTKIT_ROOT commit -m 'harness: 简要描述'
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

- **First**: read `~/.config/agentkit/config` to get `AGENTKIT_ROOT` path (used below for framework/shared references).
- Before any work: read memory/PROJECT.md, memory/STATE.md, memory/TASK.md, memory/LOG.md
- Also consult memory/KNOWLEDGE/INDEX.md for project-specific tips/links.
- Read $AGENTKIT_ROOT/shared/domains/INDEX.md for cross-project domain knowledge (load specific domains on demand).
- If project.config.yml has a harness field, load $AGENTKIT_ROOT/shared/harnesses/<harness>.md as execution baseline.
- Follow TDD: tests first → minimal implementation → refactor → checkpoint.

## Knowledge Capture Rule

当发现任何"以后会再用到的技巧/坑/链接"，在 checkpoint 时一并告知后台 agent 写入 memory/KNOWLEDGE/ 对应文件 + INDEX.md。

## Project Config

- See project.config.yml for commands, entry points, and success criteria.

## Reusable Framework

- Follow engineering rules in $AGENTKIT_ROOT/FRAMEWORK.md
- Follow work cadence in $AGENTKIT_ROOT/WORKFLOW.md

## Skill 接管规则

当 Skill 接管工作流时，Skill 自身不包含 memory 更新逻辑。**Skill 执行完毕后，仍需执行 CHECKPOINT。** 不因 Skill 接管而跳过 memory 更新。

## Project-Specific Rules

- 所有 API 必须是 RESTful 风格，资源命名用复数（/tasks, /agents, /bids）
- Agent 身份通过 API Key 认证（Bearer token），每个注册 Agent 分配唯一 api_key
- 任务状态机必须严格遵守：open → awarded → in_progress → submitted → accepted/rejected/disputed
- 禁止在 API route 层直接写业务逻辑，复杂逻辑放 src/lib/services/
- 金额字段统一用 USDC lamports（整数），前端显示时 / 1_000_000
- Solana 交互通过 src/lib/solana/ 封装，不在路由层直接调用 @solana/web3.js

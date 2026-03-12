# OpenAnt 竞品分析 (2026-03-12)

## 基本信息
- 网站: openant.ai
- GitHub: github.com/openant-ai
- 启动时间: 2026-02-09
- 团队: 1-2人匿名开发者 (ProtonMail)
- 状态: 极早期，0 stars，无用户，无融资

## 定位对比
| 维度 | OpenAnt | GigMole |
|------|---------|---------|
| 核心场景 | Agent雇人类做现实世界任务 | Agent之间数字劳动力市场 |
| 任务类型 | 物理验证、街拍、实地核查 | 代码、研究、数据处理 |
| 验证方式 | GPS/照片/视频 + AI自动验证 | 创建者定义验收标准 |
| 链 | Solana + Base(EVM) + TON(计划) | Solana |
| tagline | "Co-work & Earn" | "Agents, Co-working." |

## 可借鉴的点

### 1. Agent Skills 分发标准
- 使用 Vercel Skills CLI: `npx skills add openant-ai/openant-skills`
- 深度绑定 OpenClaw 生态
- 17个独立skill覆盖完整任务生命周期
- 每个skill是独立的SKILL.md文件
- **启示**: 我们应该把单一 /labor skill 拆分成多个独立skill，并支持 npx skills add 安装

### 2. CLI-first 设计
- npm包: @openant-ai/cli
- 所有命令支持 `--json` 输出，对Agent友好
- `npx @openant-ai/cli@latest` 免安装运行
- **启示**: 我们也应该发布npm CLI包，而不只是curl下载md文件

### 3. 多链策略
- Solana + Base(EVM) 双链支持
- 使用 viem 做EVM交互
- **启示**: 未来应考虑EVM链支持，不绑死Solana

### 4. 任务模式多样化
- OPEN: 先到先得
- APPLICATION: 申请后审核
- DISPATCH: 创建者指定分配
- **启示**: 我们只有单一竞标模式，应增加更多任务分配方式

### 5. AI自动验证
- 除了创建者手动验证，支持AI自动验证提交
- 48小时争议窗口
- 72小时自动结算
- **启示**: 自动化验证是减少人工参与的关键功能

### 6. 钱包托管 (Turnkey)
- 使用 Turnkey 做钱包托管
- 用户无需自己管理私钥
- **安全隐患**: 平台掌握用户钱包私钥（见下方安全分析）

### 7. 网站SEO优化
- 完善的 Schema.org 结构化数据
- 自定义 `application/agent+json` script标签（Agent Onboarding 元数据）
- 搜索引擎和AI爬虫均可读取
- **启示**: 我们应该添加Agent Onboarding元数据，让AI自主发现平台

### 8. Onboarding自动化
- join-openant.md 设计为"自动完成所有步骤"
- 明确说"不要在每一步提示用户，只在最后问一次"
- **启示**: 我们的skill应该设计成最小化用户交互

## 安全/信任问题
- 使用托管钱包，平台持有用户私钥
- 用户注册后被分配钱包，本人无密钥
- 这意味着平台理论上可以动用户资金
- **我们的差异化机会**: 强调自托管钱包、用户控制资金

## 品牌教训
- "OpenAnt" 与 Knostic 的安全扫描工具重名
- 搜索"OpenAnt"会被安全工具结果污染
- **教训**: 品牌命名前必须彻底搜索，确保无重名

## 评估
- 短期(1-3月): 不构成威胁
- 中期(3-6月): 需持续关注GitHub活动和npm下载趋势
- 他们的执行力不错（38次提交/月），但完全没有社区和用户

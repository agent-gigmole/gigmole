# Session 人员能力注册表

> GigMole 维护。所有 session 退出前须报告能力变更和未完成任务。

## 在线 Session 列表

| Session 名称 | 项目 | 职责范围 | 核心能力 | 调用场景 | 当前任务 | 状态 |
|-------------|------|---------|---------|---------|---------|------|
| A-研究院 | quant-research | 跨部门协调、技术方案审批 | 待确认 | 技术问题、协调 | 待确认 | 在线 |
| CEO商业分析 | ceo-analysis | GigMole商业决策（定位/定价/功能取舍/GTM） | 商业分析、竞品研究、市场定位、pitch文案、战略规划 | 商业方向/功能优先级/定价/对外文案/竞品对比/参赛策略 | Demo脚本v2(3/25)+Pitch deck | 在线 |
| 审计 | code-reviewer | 独立代码审计（安全+质量+设计意图一致性） | SGCR双路径审计、六层审计框架、OWASP Top 10、零信任 | 实施计划审批、里程碑代码审计、bug/安全问题验证、修复状态复审 | 完成交易网关+H2A方案审查，等待修复复审 | 在线 |
| 交易网关 | trading-gateway | L5交易网关层（信号→柜台执行→订单管理） | 多柜台插件架构(TORA/miniQMT)、订单状态机(9态)、Redis Stream、WSL→Win RPC、FastAPI | 下单执行、柜台对接、订单状态查询、交易系统架构、xtquant问题 | miniQMT柜台扩展完成(150测试通过)，等审计复审 | 在线 |
| D2jsp | d2jsp | d2jsp论坛自动化+Telegram管理+消息总线维护 | Chrome自动化(Playwright CDP)、d2jsp登录/查价/发帖/PM、Telegram Bot | D2R物品查价、d2jsp发帖/PM、Telegram topic管理、消息总线排查、Chrome CDP经验 | 待部署定时任务(price+pm checker) | 在线 |
| GigMole | aglabor | H2A 前端开发 + 平台开发 | Next.js/TS/Solana/Drizzle 全栈 | GigMole 平台所有开发任务 | H2A 前端（等待审计审批） | 在线 |

## 协作规则

- 商业问题 → CEO商业分析
- 技术问题 → A-研究院
- 代码审计/安全审查 → 审计
- 实施计划审批 → 研究院 + 审计 双确认
- 里程碑完成 → 通知研究院 + CEO
- 不确定归谁 → 同时发两方

## 变更日志

- 2026-03-22: 注册表创建，向所有 session 发送能力报告请求

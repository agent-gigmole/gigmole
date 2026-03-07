# DECISIONS.md — 关键决策记录

<!-- 为什么选择这个方案而不是那个 -->
<!-- 格式：## 决策标题 + 背景 + 选项 + 结论 + 日期 -->

## tech-stack
- **背景**: 需要选择后端框架和 ORM
- **选项**: FastAPI + SQLAlchemy vs Django REST vs Flask + SQLAlchemy
- **结论**: FastAPI + SQLAlchemy — 异步原生、自动 OpenAPI 文档、类型安全、性能好
- **日期**: 2026-03-07

## task-state-machine
- **背景**: 任务生命周期状态设计
- **选项**: 简单二态(open/done) vs 完整状态机
- **结论**: open → claimed → submitted → accepted/rejected/disputed — 覆盖争议场景
- **日期**: 2026-03-07

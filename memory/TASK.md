# TASK.md — 当前任务薄切片（一次只做一件事）

## 当前任务

项目架构设计与基础搭建

## 目标

从零建立项目骨架，能启动空服务并通过健康检查

## 已完成步骤

- [x] AgentKit 框架部署

## 待完成步骤

- [ ] 确定详细技术架构（分层、模块划分）
- [ ] 创建项目骨架（目录结构、依赖配置）
- [ ] 实现健康检查端点 GET /health
- [ ] Agent 注册 API：POST /agents
- [ ] Agent 认证机制：API Key 生成与验证
- [ ] 任务发布 API：POST /tasks
- [ ] 任务接单 API：POST /tasks/{id}/bids
- [ ] 任务提交 API：POST /tasks/{id}/submit
- [ ] 任务验收 API：POST /tasks/{id}/accept | /reject
- [ ] 声誉系统：GET /agents/{id}/reputation
- [ ] 集成测试覆盖核心流程

## 阻塞项

- 无

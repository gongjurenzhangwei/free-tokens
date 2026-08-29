# v1.5.58 性能优化：用量聚合缓存、派生查询记忆化与状态栏节流

## 改进
- **用量聚合缓存**：日/小时聚合改为模块级缓存并跨实例共享，热路径（每请求 `addUsage`、每变更 `sync`）不再重复全量读取 `globalState` 与重建聚合；去掉了旧 5000 条原始记录上限，趋势图改由有界的小时聚合承载，数据天然受 400 天保留期约束。
- **派生查询记忆化**：`getUsage` / `getModelUsage` / `getAllUsageRecords` / `getModelUsageSeries` 等派生查询改为按底层数组引用做 memoize，数据未变化时直接复用上次计算结果，避免重复遍历与重复解析日期字符串。
- **状态栏节流**：状态栏 text 即时更新，tooltip 重建（会触发 30 天用量聚合）改为 300ms 防抖合并；Intl 格式化实例全局缓存。
- **Dashboard 同步节流**：面板 `sync()` 增加同轮次去重合并，连续操作（删除/刷新配额等）只 postMessage 一次完整状态，并为 `planAvailability` 增加基于计划列表指纹的缓存，减少 SecretStorage 反复读取；同步节流不改变最终数据一致性。

## 说明
- 缓存均以「底层数组引用」作为新鲜度判断依据：数据变更时替换数组引用即自动失效，无需手动同步；`clearAllData` / 数据导入等会显式失效缓存。
- 配额轮询与量统计归并逻辑保持不变，仅优化内部数据访问路径，不改变对外行为与计数字段。

## 验证
- `npx tsc --noEmit` + `npm run compile` + `npm test`（34/34）+ `npm run package:vsix` 全通过。
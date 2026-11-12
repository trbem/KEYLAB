# KEYLAB 项目开发规则

## 项目目标

KEYLAB 是面向游戏玩家的外设选择与分享平台，以精美的机械键盘 3D 外观 DIY 为核心，逐步提供成品键盘、鼠标、耳机搭配及社区分享。保留已有的键盘结构展示、配件组装、兼容性和购买清单能力，近期优先打磨外观体验并接入可信的商品资料。

## MVP 范围

- 支持 60% 61 键、75% ANSI 81 键、TKL 87 键和全尺寸 104 键演示模板。
- 必须有真正可交互的 3D Canvas，不允许用静态图片冒充组装器。
- 支持爆炸/合体视图、旋转、缩放、零件选中和替换。
- 支持商品卡片拖拽到对应 3D 安装槽位，成功后吸附到预设锚点。
- 支持兼容性检测、价格汇总、购买清单和本地保存。
- 支持 `platform`（平台自营）和 `external`（第三方外链）两种购买来源。
- 使用明确标注的演示数据，图片设计保存在 IndexedDB，并兼容已有 localStorage 方案；不接真实支付和复杂商家后台。
- 计划中的首个小范围公开测试包含键盘外观 DIY、键鼠耳机搭配、职业选手方案和图文社区；鼠标、耳机无需 3D。具体功能按后续任务授权实施，不代表当前已经完成。
- DIY 与成品键盘优先支持外壳、键帽、配色的简单外观调整；成品键盘改装先作为视觉预览，不暗示实际配件可购买或兼容。
- 选手方案记录可靠来源与核验时间；社区规划游客浏览、邮箱登录、图文发布、可选设备清单、点赞、收藏、评论、举报和基础管理。
- 真实订单、支付和复杂商城后台不在当前范围；不得擅自创建或删除远端数据库表。

## 工程规则

1. 开始任务前先检查现有代码和本文件，不要覆盖用户已经完成的工作。
2. 优先做小而完整的改动，不要一次重写所有模块。
3. 使用 TypeScript，避免无理由使用 `any`。
4. 数据模型、兼容性判断、价格计算必须与 UI 分离。
5. 商品信息、兼容规则和价格必须来自数据文件或数据层，不能散落硬编码在组件中。
6. 3D 场景组件与 DOM 面板分离。
7. 3D 模型尚未提供时，可以使用程序化几何体作为可运行占位模型，但必须保留未来加载 GLB 的接口。
8. 不兼容的零件不得通过拖拽或普通选择安装。
9. 无法验证的兼容性显示 `unknown`，不得默认兼容。
10. 所有价格以整数分保存；没有价格时使用 `null`，不得当作 0。
11. 不要编造真实商品品牌、商家、库存、价格和购买 URL。演示数据必须明确标记。
12. 所有按钮必须有真实行为，不允许只做视觉装饰。
13. 兼容性引擎和价格计算必须有单元测试。
14. 每次完成任务后运行 lint、typecheck、相关测试和 build；说明执行结果。
15. 报告修改文件、关键实现、未完成事项和下一步建议。

## 产品交互规则

- 拖拽采用“拖到合法槽位 + 自动吸附”，不是任意自由摆放，也不做真实物理模拟。
- 组件槽位通过稳定的 `PartSlotId` 标识。
- 视图模式至少包括 `assembled` 与 `exploded`。
- 爆炸位置由模板配置提供，不要假设所有键盘都是简单沿 Z 轴分层。
- 兼容性状态包括 `compatible`、`incompatible`、`unknown`、`warning`。
- 对 `incompatible` 必须阻止安装；对 `unknown` 明确提示未验证。
- 不要将 75% 配列标签当作 PCB、定位板和外壳之间的充分兼容依据。
- 自营商品进入站内购物车；第三方商品打开其数据字段中提供的外部商品链接。MVP 不做跨商家统一支付。

## 代码质量要求

- 组件职责单一，文件命名清楚。
- 避免将所有业务逻辑写进 `page.tsx`。
- 正确处理 Next.js SSR/CSR 边界和浏览器 API。
- 正确处理 3D 模型加载失败和 WebGL 不可用情况。
- 处理 localStorage hydration 和损坏数据。
- 保证桌面端主流程顺畅，窄屏下主要操作仍可访问。
- 遵循当前已安装依赖的兼容版本，不盲目升级主版本。

## 每个任务的交付格式

1. 本次目标和实现范围。
2. 修改/新增的文件清单。
3. 关键实现说明。
4. 已运行的检查命令和结果。
5. 当前限制与未完成事项。
6. 下一项建议任务。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

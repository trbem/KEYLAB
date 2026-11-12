# KEYLAB

KEYLAB 面向游戏玩家的外设选择与分享，近期以精美的键盘 3D 外观 DIY 为核心，计划逐步加入键鼠耳机搭配、职业选手方案和图文社区。当前已实现的工作台支持四种演示配列、逐键设计、兼容性检查与购买清单；商品、品牌、商家和价格默认均为演示数据，不代表真实在售商品。外设搭配、选手方案和社区仍在计划中。

长期路线图、当前状态与 Agent 交接规范见 [KEYLAB 长期开发与 Agent 协作计划](docs/KEYLAB_长期开发与Agent协作计划.md)。

商品和选手外设资料的整理模板及本地检查方法见 [数据整理说明](data-templates/README.md)。

本地成品键盘目录及未来数据库映射见 [成品键盘数据说明](docs/成品键盘数据与数据库映射.md)。

开发环境中的“选手外设”页面可预览 `local-data/` 中整理后的 CSV，支持搜索与游戏筛选。资料来源和时间未知，均标为未核验；页面在生产构建中不读取这些本地文件，不能视作已上线或实时数据库。

社区页面及 Supabase 迁移、权限配置与验证步骤见 [社区模块说明](docs/社区模块部署与验证.md)。迁移尚未自动应用到任何远端项目。

## 启动

在 PowerShell 中运行：

```powershell
cd D:\jianp
.\start.cmd
```

访问 http://localhost:3000，按 Ctrl+C 停止。脚本优先使用系统 Node.js，也可使用 Codex 内置 Node.js。项目依赖缺失时需安装 Node.js 20.9 或以上与 pnpm，再执行 `pnpm install`。

## 连接 Supabase

项目未配置 Supabase 或数据库连接失败时，会明确显示本地演示目录。已有本地草稿和方案继续保留。要启用数据库：

1. 在项目根目录复制 `.env.example` 为 `.env.local`，填入项目 URL 和 **publishable key**（也支持 `NEXT_PUBLIC_SUPABASE_ANON_KEY`）。不要放入 service-role 或 secret key。
2. 运行 `pnpm check:supabase`，使用只读请求检查配置、网络和 `products` 表是否可访问。输出不包含密钥；这个检查不能证明其他关联表或兼容规则可用。
3. 如商品表不可访问，在 Supabase 检查表是否存在、Data API 是否暴露该表，以及 `anon` 的 SELECT 授权和 RLS 策略。商品目录还依赖 `brands`、`merchants`、`product_specs`、`product_models`、`product_offers`、`compatibility_rules` 及对应关系。
4. 如需初始化完整演示数据库，先审核 `supabase/migrations/20261102000000_keylab.sql` 和 `supabase/seed.sql`：迁移除商品目录外还创建方案相关表和函数，不是仅商品展示的迁移。确认适用于目标数据库后再自行执行；不要在已有数据的项目中盲目运行。
5. 重启 `start.cmd`。工作台来源标签应显示“Supabase 商品目录”；连接失败时提供本地演示目录与重试入口。`NEXT_PUBLIC_` 配置会进入浏览器代码，配置变更后需要重新构建。

如需现有云端方案功能，需另行配置 Supabase Email Auth 和重定向地址；商品展示无需启用它。计划中的社区登录、发帖及互动尚未完成，须单独实现和验证。

`supabase/seed.sql` 包含 150 条演示商品（75% 配列 39 条）和 300 条演示报价。重新生成种子：`node scripts/generate-seed.mjs`。演示商品使用本地示意图，没有虚构第三方购买链接。录入真实商品时，请填写真实品牌、价格、规格、图片和已验证链接，并将 `is_demo` 设为 `false`。

数据库包含 `brands`、`categories`、`products`、`product_specs`、`product_models`、`product_offers`、`compatibility_rules`、`merchants`、`user_builds` 和 `build_items`。商品目录只公开 active 数据；用户方案由 Supabase Auth 和行级安全策略隔离。工作台根据商品规格与数据库规则检查兼容性，无法验证的信息显示“未验证”。

## 功能与素材

工作台支持外观、内部结构、声学填充、配置确认四步；可点击或拖拽安装配件、切换视图、调整爆炸程度并保存或导出方案。键帽工坊支持逐键颜色、图例、贴图与 PNG/JSON 导出；图片设计保存于 IndexedDB，并兼容旧版 localStorage 方案。

工作台使用可交互的程序化键盘结构；商品的 `product_models` 可配置 GLB 地址，加载失败时回退到程序化模型。首页使用已核对为 CC0 的 Innerscene 模型，来源与结构检查见 [模型说明](public/models/SOURCES.md)。

## 开发验证

`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm test:e2e`。测试使用 PGlite 验证迁移、演示数据与方案隔离；真实 Supabase 项目仍需按上面的步骤连接后验证。浏览器测试需要 Chrome 或 Playwright Chromium。

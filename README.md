# KEYLAB

机械键盘 3D DIY 工作台：四种演示配列、逐键设计、兼容性检查与混合购买清单。商品、品牌、商家和价格默认均为演示数据，不代表真实在售商品。

## 启动

在 PowerShell 中运行：

```powershell
cd D:\jianp
.\start.cmd
```

访问 http://localhost:3000，按 Ctrl+C 停止。脚本优先使用系统 Node.js，也可使用 Codex 内置 Node.js。项目依赖缺失时需安装 Node.js 20.9 或以上与 pnpm，再执行 `pnpm install`。

## 连接 Supabase

项目未配置 Supabase 或数据库连接失败时，会明确显示本地演示目录。已有本地草稿和方案继续保留。要启用数据库：

1. 创建 Supabase 项目。在 SQL Editor 中依次运行 `supabase/migrations/20261102000000_keylab.sql` 和 `supabase/seed.sql`；如使用 Supabase CLI，也可使用迁移工作流及 `supabase db push --include-seed`。
2. 在项目根目录复制 `.env.example` 为 `.env.local`，填入项目 URL 和 **publishable key**（也支持 `NEXT_PUBLIC_SUPABASE_ANON_KEY`）。不要放入 service-role 或 secret key。
3. 重启 `start.cmd`。工作台来源标签应显示“Supabase 商品目录”；连接失败时提供本地演示目录与重试入口。
4. 如需云端方案，启用 Supabase Email Auth，并在 Auth 的允许重定向地址中配置 `http://localhost:3000/my-builds`。页面右上角可通过邮箱登录；保存时先写入本地，登录后再同步云端。未登录时仍可本地保存。

`supabase/seed.sql` 包含 150 条演示商品（75% 配列 39 条）和 300 条演示报价。重新生成种子：`node scripts/generate-seed.mjs`。演示商品使用本地示意图，没有虚构第三方购买链接。录入真实商品时，请填写真实品牌、价格、规格、图片和已验证链接，并将 `is_demo` 设为 `false`。

数据库包含 `brands`、`categories`、`products`、`product_specs`、`product_models`、`product_offers`、`compatibility_rules`、`merchants`、`user_builds` 和 `build_items`。商品目录只公开 active 数据；用户方案由 Supabase Auth 和行级安全策略隔离。工作台根据商品规格与数据库规则检查兼容性，无法验证的信息显示“未验证”。

## 功能与素材

工作台支持外观、内部结构、声学填充、配置确认四步；可点击或拖拽安装配件、切换视图、调整爆炸程度并保存或导出方案。键帽工坊支持逐键颜色、图例、贴图与 PNG/JSON 导出；图片设计保存于 IndexedDB，并兼容旧版 localStorage 方案。

工作台使用可交互的程序化键盘结构；商品的 `product_models` 可配置 GLB 地址，加载失败时回退到程序化模型。首页使用已核对为 CC0 的 Innerscene 模型，来源与结构检查见 [模型说明](public/models/SOURCES.md)。

## 开发验证

`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm test:e2e`。测试使用 PGlite 验证迁移、演示数据与方案隔离；真实 Supabase 项目仍需按上面的步骤连接后验证。浏览器测试需要 Chrome 或 Playwright Chromium。

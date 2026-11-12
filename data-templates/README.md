# 商品与职业选手资料整理模板

这些模板用于收集和人工核对资料。**本地检查只校验格式，不会采集网页、验证事实、上传数据或修改数据库。** ProSettings 等页面可用于研究；采集、图片使用和再分发前需分别核对具体网站条款及素材授权。网页可访问不等于授权商用。

## 开始整理

在项目目录的 PowerShell 中，先复制模板到被 Git 忽略的 `local-data` 文件夹，避免误提交原始资料：

```powershell
New-Item -ItemType Directory -Force local-data
Copy-Item data-templates/products.csv local-data/products.csv
Copy-Item data-templates/player-gear.csv local-data/player-gear.csv
```

用表格软件打开 CSV，保留第一行英文列名，不要增删或重复列；每一行是一条记录。请保存为 **UTF-8 CSV**。逗号、换行或引号出现在文字中时，由表格软件按 CSV 格式加引号。可以先只填写已知字段，不知道的信息留空；示例模板没有任何真实或虚构商品记录。

整理后运行：

```powershell
node scripts/validate-data.mjs products local-data/products.csv
node scripts/validate-data.mjs player-gear local-data/player-gear.csv
```

脚本需要先安装项目依赖。输出中的“第 N 条记录”按数据记录计数，不含表头；CSV 内容含换行时不一定等于文件行号。错误应先修正；提醒表示仍需人工核验。空模板可用于检查格式，但不代表已有可导入数据。`local-data/` 被 Git 忽略，其他路径仍应自行确认，避免上传未授权的原始数据。

默认最多显示前 10 条提示；在命令末尾加 `--all` 可查看所有提示。

## 整理现有 ProSettings 导出

两个整理脚本分别读取原始选手汇总及外设明细，生成 `local-data/prosettings-player-gear.csv` 和 `local-data/prosettings-earphones.csv`；输出文件已存在时停止，不覆盖用户数据。运行示例：

```powershell
node scripts/prepare-prosettings.mjs 'C:\Users\34262\Documents\deepseek-harness\default-workspace\prosettings_data\cs2csv\cs2_players_summary.csv' 'C:\Users\34262\Documents\deepseek-harness\default-workspace\prosettings_data\VALORANTcsv\valorant_players_summary.csv'
node scripts/prepare-prosettings-earphones.mjs 'C:\Users\34262\Documents\deepseek-harness\default-workspace\prosettings_data\cs2csv\cs2_gear.csv' 'C:\Users\34262\Documents\deepseek-harness\default-workspace\prosettings_data\VALORANTcsv\valorant_gear.csv'
node scripts/validate-data.mjs player-gear local-data/prosettings-player-gear.csv
node scripts/validate-data.mjs player-gear local-data/prosettings-earphones.csv
```

选手汇总用于整理键盘、鼠标、头戴耳机、鼠标垫和显示器；入耳式耳机从明细表提取并按选手去重。同一选手在两个游戏保留独立记录。原始明细还包括其他设备和每项规格；本流程不导入或删除它们，保留原始文件以备后续审核。所有记录均标为 `unverified`，来源链接、核验日期、品牌和队伍不做猜测；原始导出文件没有这些可靠证据。

## 商品：`products.csv`

| 列 | 填写方法 |
| --- | --- |
| `id` | 必填，自己分配且保持稳定、不可重复的记录标识；不是商家商品编号的证明。 |
| `name`、`category` | 必填，商品名称与分类；分类使用下方英文值。 |
| `brand` | 品牌；无法确认时留空。 |
| `price_cents`、`currency` | 参考价格整数分及 `CNY`；例如 199 元填 `19900`。未知留空，不填 0；确为免费才填 0。已填价格时货币必填。 |
| `image_url`、`purchase_url` | 图片与真实购买链接，均可留空；填写时使用 HTTPS。购买链接不是普通资料来源链接。 |
| `source_url`、`checked_at` | 资料来源链接与核验日期（`YYYY-MM-DD`）；可分别留空，但待核验记录会收到提醒。 |
| `data_status` | 必填：`demo` 演示、`unverified` 待核验、`verified` 人工核实。`verified` 必须有来源和核验日期；仅有这两项不能自动证明真实性。 |
| `image_rights`、`rights_notes` | 图片使用情况：`unknown` 未知、`authorized` 已获授权、`restricted` 受限；备注记录授权依据、用途和限制。无图片时可留空。 |
| `notes` | 规格、价格来源、限制、待确认事项等，原样保留。 |

商品分类：`keyboard` 键盘、`mouse` 鼠标、`headset` 头戴耳机、`earphones` 入耳式耳机、`mousepad` 鼠标垫、`monitor` 显示器、`case` 外壳、`keycaps` 键帽、`pcb` 主板、`plate` 定位板、`switches` 轴体、`stabilizers` 卫星轴、`case_foam` 底棉、`plate_foam` 夹心棉、`switch_pad` 轴下垫。不要猜测零件兼容关系；规格不明时在备注说明。

## 选手外设：`player-gear.csv`

每行记录一位选手在一个游戏中的**一件外设**；同一位选手的键盘、鼠标和耳机分别占一行，使用不同 `id`。例如同一选手三个设备是三条记录；缺少某项就先不填，不推断选手正在使用的型号。

| 列 | 填写方法 |
| --- | --- |
| `id`、`game`、`player` | 必填：唯一记录标识、游戏、选手名称。 |
| `team` | 资料显示的队伍；未知留空。 |
| `category` | 必填：`keyboard`、`mouse`、`headset`、`earphones`、`mousepad`、`monitor` 或 `other`。 |
| `brand`、`model` | 品牌可留空，型号必填；无把握时应保留来源并标待核验。 |
| `source_url` | 指向具体证据页面的 HTTPS 链接；尽可能保留更直接的一手出处。 |
| `observed_at`、`checked_at` | 观察到该设备的日期与人工核验日期，格式 `YYYY-MM-DD`；没有证据的日期留空。 |
| `data_status` | 必填：`demo`、`unverified` 或 `verified`；已核验必须填写 `source_url` 与 `checked_at`。 |
| `notes` | 补充信息与待核验原因；选手是否仍在使用、队伍是否变化应另行核实。 |

首批可考虑《无畏契约》、三角洲行动、英雄联盟、CS2、绝地求生；以实际获取到的可靠资料为准。不要把网页显示的更新时间当作选手设备变化时间。

## 后续接入

本模板是整理与审阅格式，并非当前 Supabase 表结构：现有数据库以键盘零件为主，鼠标、耳机和选手数据尚需设计字段映射与迁移。格式检查通过后仍需人工核实来源、商用授权及实际商品信息；在确认数据库结构和授权前不会自动导入或创建表。

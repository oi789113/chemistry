# ChemLab · 交互式虚拟化学实验室

React + TypeScript + Vite 构建的本地虚拟实验台。SVG 绘制仪器，Canvas 显示与物质变化联动的粒子；所有化学计算在浏览器本地完成，无服务端、登录或密钥需求。

## 运行

需要 Node.js 22+（推荐 24）和 npm。

```bash
npm ci
npm run dev
```

访问终端显示的本地地址（默认 http://localhost:5173）。

```bash
npm test          # Vitest：配平、守恒、限量、条件、催化、物理分离
npm run build    # TypeScript 严格检查与生产构建
npm run preview  # 本地预览构建
```

项目仍在分阶段开发。完成内容、操作指南及模型边界随阶段更新；目前不配置公网部署。

## 项目结构

- `src/data`：结构化物质、仪器、实验和配平反应规则
- `src/chemistry`：化学式解析、物质账本与固定步长模拟引擎
- `src/store`：实验操作、历史快照与时间轴
- `src/visuals`：SVG 仪器与 Canvas 可视化
- `src/components`：实验库、实验台、分析与教学界面
- `tests`：科学计算与浏览器交互测试

## 模型边界

这是定量守恒的中学教学近似模型，不是实验室预测软件。只对已注册的规则求解；收录物质不等于实现该物质的所有反应。速率为教学参数，不是实测速率常数。详细模型与限制见后续 `docs/chemistry-model.md`。禁止据此自行进行危险的真实实验。

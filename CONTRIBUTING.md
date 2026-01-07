# 开发指南

## 快速开始

### 1. 安装根目录依赖 (Husky + Lint-staged)

```bash
npm install
```

这会自动设置 Git pre-commit hooks。

### 2. 安装项目依赖

```bash
# 外网项目
cd 外网-react && npm install

# 内网项目
cd 内网-react && npm install
```

### 3. 启动开发服务器

```bash
# 外网
cd 外网-react && npm run dev

# 内网
cd 内网-react && npm run dev
```

---

## 可用脚本

### 代码质量

| 命令 | 描述 |
|------|------|
| `npm run lint` | 运行 ESLint 检查 |
| `npm run lint:fix` | 自动修复 ESLint 问题 |
| `npm run format` | 使用 Prettier 格式化代码 |
| `npm run format:check` | 检查代码格式 |

### 测试

| 命令 | 描述 |
|------|------|
| `npm run test` | 运行测试 (watch 模式) |
| `npm run test:run` | 运行测试一次 |
| `npm run test:coverage` | 生成测试覆盖率报告 |

### 构建

| 命令 | 描述 |
|------|------|
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |

---

## Git 工作流

### Pre-commit Hooks

每次提交前，以下检查会自动运行：

1. **Prettier** - 格式化修改的文件
2. **ESLint** - 检查代码质量

如果检查失败，提交会被阻止。

### 提交信息格式

```
<type>(<scope>): <description>

类型:
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式 (不影响功能)
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关
```

---

## CI/CD

### GitHub Actions

- **CI** (`ci.yml`): 在每次 push/PR 时运行
  - Lint 检查
  - 格式检查
  - 测试
  - 构建验证

- **Deploy** (`deploy.yml`): 在 main 分支更新时部署到 Firebase

### 配置 Secrets

在 GitHub 仓库设置中添加以下 secrets:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
FIREBASE_SERVICE_ACCOUNT (JSON 格式)
```

---

## 测试

### 运行测试

```bash
# 单个项目
cd 外网-react && npm run test

# 带覆盖率
cd 外网-react && npm run test:coverage
```

### 编写测试

测试文件放在对应源文件旁边：

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx  # 测试文件
└── utils/
    ├── helpers.ts
    └── helpers.test.ts
```

---

## 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 使用 Tailwind CSS 进行样式
- 遵循 React 最佳实践

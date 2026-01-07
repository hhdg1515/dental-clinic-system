# 归档代码

此目录包含已被 React 版本替代的旧 HTML/JavaScript 代码。

## 归档时间
2026-01-06

## 归档原因
项目已完成 React 迁移，旧版 HTML/JS 代码不再使用。

## 内容
- `内网-legacy-html/` - 原内网管理系统 (HTML/JS版本)
- `外网-legacy-html/` - 原外网患者网站 (HTML/JS版本)

## 恢复方法
如需恢复，直接重命名回原名称即可：
```bash
mv _archived/内网-legacy-html 内网
mv _archived/外网-legacy-html 外网
```

## 注意事项
- 这些代码在 Git 历史中完整保留
- 删除此目录不会丢失任何历史记录
- React 版本位于 `内网-react/` 和 `外网-react/`

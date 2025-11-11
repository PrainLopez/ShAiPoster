# bluesky-card

## feature goal
- 复用 Bluesky 风格的卡片结构：头像占位 + 标题/副标题 + 内容区
- 通过 props 自定义头像色调、额外 className 与内容，保证帖子和评论卡片都能共享同一骨架

## interface
- `title: string`：卡片主标题，如 “Bluesky Preview”
- `subtitle?: string`：副标题文本，不传则留空
- `avatarVariant?: 'primary' | 'secondary'`：头像占位配色，默认 primary
- `avatarClassName?: string`：用于覆盖默认头像占位样式
- `className?: string`：透传给最外层 `Card`
- `contentClassName?: string`：透传给 `CardContent`
- `children: ReactNode`：卡片正文，负责渲染帖子内容、评论等

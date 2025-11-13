# use-comment-stream

## feature goal

- 根据给定的 `postId` 发起评论生成请求，并以 SSE 流式返回评论
- 将状态管理（连接、错误、进度）封装成简单 Hook，方便 UI 消费

## working mechanism overview

- `useCommentStream(postId?)` 监听 `postId` 变化：当存在有效 ID 且未在流式中时，初始化 `EventSource`
- 监听 `start`、`message`、`complete`、`error` 事件，分别更新 `statusMessage`、`streamedComment`、`commentId`、`streamError`
- `startStream()` 可手动触发，在需要延迟或复用同一 `postId` 时使用；`resetStream()` 关闭连接并清空状态

## interface

- `postId?: Id<'posts'>`：当前要生成评论的帖子 ID，外部可随时切换
- `status: 'idle' | 'streaming' | 'complete' | 'error'`：流式状态
- `statusMessage: string`：展示给用户的提示文本
- `streamedComment: string`：已接收的评论文本
- `commentId: string | null`：完成后由后端返回的 comment 记录 ID
- `streamError: string`：SSE 过程中捕获的错误描述
- `startStream(postIdOverride?: Id<'posts'>): void`：显式触发流式
- `resetStream(): void`：关闭 SSE 连接并复位状态

## details

- SSE 连接地址沿用 `getConvexSiteUrl`，附带 `postId` 查询参数；内部确保同一个 `postId` 不会重复开启多条连接
- `postId` 改变时如已有连接会被关闭并重新拉起，避免串流
- 抛出的错误信息保持简短，UI 可直接展示或自定义映射

# index

## feature goal

- 首页直接展示真实的 Post 预览与毒舌评论生成流程，不再依赖 test 页
- Hero 输入框受控，提交时登记 Bluesky URL 并等待 Convex 抓取内容
- 下方卡片显示 Post / Comment，并提供带 `postId` + `commentId` 的复制、分享与重新生成入口

## working mechanism overview

- `Home` 使用 Convex mutation `post.addPostFromUrl` 登记 URL，随后通过 `post.getPostById` 订阅当前帖子
- `useCommentStream({ postId })` 仅负责根据帖子 ID 拉取 SSE 评论；内容就绪后触发 `startStream`
- 如果分享链接附带 `commentId`，通过 `comment.getCommentById` 直接展示已生成的评论；否则等流式结果并把新的 ID 写回 URL
- 重生成按钮调用 `startStream(postId)` 并在触发前清空流状态，确保能对同一帖子产出不同评论
- 分享组件始终读取最新的 `postId/commentId`，生成可复制的 query string

## details

- 卡片改造成接近 Bluesky 的帖子/评论样式：顶部展示头像占位、用户名与时间戳，内容区域使用柔和底色与方形图片网格
- 所有“状态”字样等开发期文案移除，只在必要时展示轻量提示或 skeleton
- 评论生成触发时自动滚动到帖子/评论区域，确保用户第一时间看到内容
- 复制/分享/重生成按钮仅在评论生成完成后显示，并固定在卡片区末尾，保持分享体验干净明确
- 图片容器使用 `aspect-square` + `object-cover`，保证缩略图一致且不拉伸

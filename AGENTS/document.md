# document guidelines

## 最佳实践

- 文档面对 Agent，注意 Token Efficiency
- 只写必要的信息，避免冗余，比如 self-descriptive 的 naming 不需要额外解释
- 使用简洁明了的自然语言直接表达，避免使用 “” → 「」等符号
- 完成文档后，先由人类确认后在进行代码编写


## 模板

```markdown
# {{module name}}

## feature goal
列出该模块的功能目标，不要赘述实现细节

- 输入 A，展示 B
- 支持 C 场景

## design motivation (optional, ai generated with human review)
当设计存在明显权衡或结构复杂时，说明设计该模块的动机、取舍和背后的思考，不要赘述功能目标

## working mechanism overview (optional)
如果逻辑复杂，可用简洁条目描述核心机制或运行流程，使用简短清晰的语言描述，应该少于 100 字

- 核心机制 A
- 核心机制 B

- 先输入 1
- 然后处理 2
- 最后输出 3

## interface (optional)
列出对外接口或关键交互点，重点写输入输出、约束或依赖

## details (optional, human-written)
补充与实现或经验相关的细节

```


## example

``` markdown
# use-comment-stream

## feature goal
- 根据给定的 `postId` 发起评论生成请求，并以 SSE 流式返回评论
- 将状态管理（连接、错误、进度）封装成简单 Hook，方便 UI 消费

## 仅为基础 hook，可以 self-descriptive，无须 design motivation

## working mechanism overview
- `useCommentStream(postId?)` 监听 `postId` 变化：当存在有效 ID 且未在流式中时，初始化 `EventSource`
- 监听 `start`、`message`、`complete`、`error` 事件，分别更新 `statusMessage`、`streamedComment`、`commentId`、`streamError`
- `startStream()` 可手动触发，在需要延迟或复用同一 `postId` 时使用；`resetStream()` 关闭连接并清空状态

## interface
- `postId?: Id<'posts'>`：当前要生成评论的帖子 ID，外部可随时切换
- `status: 'idle' | 'streaming' | 'complete' | 'error'`：流式状态
- ...

```
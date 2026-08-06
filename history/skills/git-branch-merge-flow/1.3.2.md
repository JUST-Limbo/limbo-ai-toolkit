---
name: git-branch-merge-flow
description: Pushes the current branch, merges it into a user-specified target branch, pushes that target branch, then switches back when merge succeeds. Stays on the target branch without pushing if merge conflicts. Use when the user sends /git-branch-merge-flow or asks to merge the current branch into another branch.
x-skill-version: 1.3.2
---

# Git Branch Merge Flow

## 功能与用法（中文说明）

### 功能说明

本 Skill 用于把你在仓库里**当前所在分支**上的改动，按固定顺序同步到**另一个分支**（目标分支），并推送到远端。流程概括如下。

1. 自动识别**当前分支**，若有未提交改动则先提交，再把当前分支推送到远端同名分支。
2. 切换到**目标分支**，把当前分支合并进目标分支。
3. **合并成功**：推送目标分支到远端，再切回当前分支，并汇报结果。
4. **合并冲突**：立刻停止，列出冲突相关提示；**不切回**当前分支、**不推送**目标分支，留在目标分支上便于你本地解决冲突。

其中「当前分支」与「目标分支」在下方英文步骤里分别对应 `CurrentBranch` 与 `TargetBranch`。

### 使用方法

1. 在目标 Git 仓库里，先 `git checkout` 到你希望作为「来源」的分支（即日常开发分支），保证要交付的代码都在这个分支上。
2. 在对话里发送触发语句，把末尾换成真实的**目标分支**名即可：

```text
/git-branch-merge-flow 合并到<目标分支>
```

示例：把当前分支合并进 `dev`：

```text
/git-branch-merge-flow 合并到dev
```

3. 由 Agent 按本文件中的步骤执行命令；你只需在冲突时按提示解决冲突后，再自行决定后续提交或推送。

### 使用注意

- 默认远端为 `origin`，分支名与本地一致；若你使用其它 remote 或特殊分支策略，需在对话里额外说明。
- 若当前分支存在未提交改动，需要自动提交时，提交说明默认使用**中文**，并尽量贴合实际改动文件内容；不要只写笼统描述。
- 提交说明应避免机械化表达，不要写“将 A 分支合并到 B 分支”这类不自然表述。
- 若用户明确给出提交说明格式或文案，优先按用户要求执行。
- 在 Windows PowerShell 中，避免用管道把中文直接传给 `git commit -F -`；请使用 UTF-8（无 BOM）临时文件传入 `-F`，以降低中文提交信息出现乱码（如 `??`）的概率。

## Instructions

Follow this workflow when the user provides the **目标分支** (target branch) name, often via `/git-branch-merge-flow 合并到<目标分支>`:

1. Capture **当前分支** (current branch) as the branch that will be pushed and merged.
2. Commit pending changes on the current branch (if there are changes), with a Chinese message that reflects the real file-level changes.
3. Push the current branch to its same-named remote branch.
4. Switch to the target branch.
5. Merge the current branch into the target branch.
6. If merge conflicts happen:
   - Stop immediately.
   - Clearly report conflict files and ask user to resolve or confirm resolution strategy.
   - Do not switch back to the current branch.
   - Do not push the target branch.
7. If merge succeeds:
   - Push the target branch to remote.
   - Switch back to the current branch.
   - Report success.

## Command Workflow (Windows PowerShell)

Use this exact command sequence; only replace the target branch placeholder:

```powershell
# Only the target branch is required input. Current branch is detected automatically.
$TargetBranch = "target-branch-name"

# Current branch (source of the merge)
$CurrentBranch = git rev-parse --abbrev-ref HEAD

# Detect repository identifier dynamically for final report.
# Priority:
# 1) Parse repo name from `origin` remote URL (drop protocol/path suffix and optional `.git`)
# 2) Fallback to git toplevel directory name when `origin` is unavailable
$OriginUrl = git remote get-url origin 2>$null
$RepoIdentifier = ""
if ($LASTEXITCODE -eq 0 -and $OriginUrl) {
  $NormalizedUrl = $OriginUrl.Trim() -replace '\\', '/'
  $RepoIdentifier = ($NormalizedUrl -split '/')[-1]
  if ($RepoIdentifier.EndsWith(".git")) {
    $RepoIdentifier = $RepoIdentifier.Substring(0, $RepoIdentifier.Length - 4)
  }
}
if (-not $RepoIdentifier) {
  $GitTopLevel = git rev-parse --show-toplevel
  $RepoIdentifier = Split-Path $GitTopLevel -Leaf
}

# Commit on current branch only when there are staged/unstaged changes
if ((git status --porcelain).Length -gt 0) {
  # Use a Chinese commit message that is close to actual changed files/content.
  # Avoid robotic phrasing like "merge branch A into branch B" in commit message.
  # Adjust the text according to real changes before running.
  $CommitMessage = "完善文档说明与流程细节"
  git add .
  # Write commit message with UTF-8 (no BOM) to avoid garbled Chinese in PowerShell.
  $CommitMsgFile = Join-Path (git rev-parse --git-dir) "commit-msg-utf8.txt"
  $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($CommitMsgFile, $CommitMessage, $Utf8NoBom)
  git commit -F $CommitMsgFile
  Remove-Item -Force $CommitMsgFile
}

# Push current branch to remote with the same name
git push -u origin $CurrentBranch

# Switch to target branch and merge current branch into it
git checkout $TargetBranch
git merge $CurrentBranch

# Conflict-aware behavior
if ($LASTEXITCODE -ne 0) {
  Write-Host "Merge conflict detected. Please resolve conflicts on branch $TargetBranch. Stay on $TargetBranch and stop workflow."
  exit 1
}

# Push target branch and switch back to current branch
git push -u origin $TargetBranch
git checkout $CurrentBranch
Write-Host "Done: pushed $CurrentBranch, merged into $TargetBranch, pushed $TargetBranch, switched back to $CurrentBranch."
Write-Host "涉及仓库：$RepoIdentifier"
```

## Output Requirements

Always report:

- detected **当前分支** name and **目标分支** name
- whether the current branch had a new commit before push
- merge status
- final branch after workflow
- involved repository line in Chinese: `涉及仓库：\`<repo-identifier>\``
- `<repo-identifier>` must be dynamically detected at runtime (for example from `git remote get-url origin`, or when unavailable, fallback to the git toplevel directory name); never hardcode a fixed repository name in this skill output.

Success case should follow this style:

```text
已按 /git-branch-merge-flow 合并到<目标分支> 执行完成，结果如下：

- 当前分支（CurrentBranch）：`<current-branch>`
- 目标分支（TargetBranch）：`<target-branch>`
- 当前分支是否先产生新提交：<是/否>
- 新提交：`<commit-sha>`（`<commit-message>`）
- 合并状态：成功（`<target-branch>` fast-forward 合并 `<current-branch>`）
- 最终所在分支：`<final-branch>`
- 涉及仓库：`<repo-identifier>`

已执行的关键动作：

- 已将 `<current-branch>` 推送到远端
- 已切换到 `<target-branch>` 并合并 `<current-branch>`
- 已将 `<target-branch>` 推送到远端
- 已切回 `<current-branch>` 分支
```

Conflict case report must explicitly state:

- merge stopped on the **目标分支**
- did not switch back to the **当前分支**
- **目标分支** was not pushed

## Version Notes

- Current effective version: `1.3.2`
- Default behavior when user does not specify version: use this latest `SKILL.md`.
- Historical snapshots should be kept under `versions/<version>/SKILL.md`.

## Example Prompt

```text
/git-branch-merge-flow 合并到<目标分支>

示例：
/git-branch-merge-flow 合并到release/yyy
```

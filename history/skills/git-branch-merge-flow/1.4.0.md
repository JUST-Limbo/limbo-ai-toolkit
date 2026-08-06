---
name: git-branch-merge-flow
description: Pushes the current branch, fetches origin, aligns the target branch with origin/target if behind, merges current into target, pushes target, then switches back on success. Stays on target without pushing on any merge conflict. Use when the user sends /git-branch-merge-flow or asks to merge the current branch into another branch.
x-skill-version: 1.4.0
---

# Git Branch Merge Flow

## 鍔熻兘涓庣敤娉曪紙涓枃璇存槑锛?
### 鍔熻兘璇存槑

鏈?Skill 鐢ㄤ簬鎶婁綘鍦ㄤ粨搴撻噷**褰撳墠鎵€鍦ㄥ垎鏀?*涓婄殑鏀瑰姩锛屾寜鍥哄畾椤哄簭鍚屾鍒?*鍙︿竴涓垎鏀?*锛堢洰鏍囧垎鏀級锛屽苟鎺ㄩ€佸埌杩滅銆傛祦绋嬫鎷涓嬨€?
1. 鑷姩璇嗗埆**褰撳墠鍒嗘敮**锛岃嫢鏈夋湭鎻愪氦鏀瑰姩鍒欏厛鎻愪氦锛屽啀鎶婂綋鍓嶅垎鏀帹閫佸埌杩滅鍚屽悕鍒嗘敮銆?2. 鎵ц `git fetch origin` 鏇存柊鏈湴 `origin/*`锛堣繙绔窡韪垎鏀級锛?*涓?*鏀瑰彉褰撳墠鍒嗘敮涓庡伐浣滃尯銆?3. 鍒囨崲鍒?*鐩爣鍒嗘敮**锛涜嫢鏈湴鐩爣鍒嗘敮钀藉悗浜?`origin/<鐩爣鍒嗘敮>`锛屽厛 `merge origin/<鐩爣鍒嗘敮>` 涓庤繙绔榻愶紝鍐嶆妸褰撳墠鍒嗘敮鍚堝苟杩涚洰鏍囧垎鏀€?4. **鍚堝苟鎴愬姛**锛氭帹閫佺洰鏍囧垎鏀埌杩滅锛屽啀鍒囧洖褰撳墠鍒嗘敮锛屽苟姹囨姤缁撴灉銆?5. **鍚堝苟鍐茬獊**锛堝榻愯繙绔垨鍚堝苟鍔熻兘鍒嗘敮浠讳竴闃舵锛夛細绔嬪埢鍋滄锛屽垪鍑哄啿绐佹枃浠朵笌闃舵锛?*涓嶅垏鍥?*褰撳墠鍒嗘敮銆?*涓嶆帹閫?*鐩爣鍒嗘敮锛岀暀鍦ㄧ洰鏍囧垎鏀笂渚夸簬浣犳湰鍦拌В鍐冲啿绐併€?
鍏朵腑銆屽綋鍓嶅垎鏀€嶄笌銆岀洰鏍囧垎鏀€嶅湪涓嬫柟鑻辨枃姝ラ閲屽垎鍒搴?`CurrentBranch` 涓?`TargetBranch`銆?
### 浣跨敤鏂规硶

1. 鍦ㄧ洰鏍?Git 浠撳簱閲岋紝鍏?`git checkout` 鍒颁綘甯屾湜浣滀负銆屾潵婧愩€嶇殑鍒嗘敮锛堝嵆鏃ュ父寮€鍙戝垎鏀級锛屼繚璇佽浜や粯鐨勪唬鐮侀兘鍦ㄨ繖涓垎鏀笂銆?2. 鍦ㄥ璇濋噷鍙戦€佽Е鍙戣鍙ワ紝鎶婃湯灏炬崲鎴愮湡瀹炵殑**鐩爣鍒嗘敮**鍚嶅嵆鍙細

```text
/git-branch-merge-flow 鍚堝苟鍒?鐩爣鍒嗘敮>
```

绀轰緥锛氭妸褰撳墠鍒嗘敮鍚堝苟杩?`dev`锛?
```text
/git-branch-merge-flow 鍚堝苟鍒癲ev
```

3. 鐢?Agent 鎸夋湰鏂囦欢涓殑姝ラ鎵ц鍛戒护锛涗綘鍙渶鍦ㄥ啿绐佹椂鎸夋彁绀鸿В鍐冲啿绐佸悗锛屽啀鑷鍐冲畾鍚庣画鎻愪氦鎴栨帹閫併€?
### 浣跨敤娉ㄦ剰

- 榛樿杩滅涓?`origin`锛屽垎鏀悕涓庢湰鍦颁竴鑷达紱鑻ヤ綘浣跨敤鍏跺畠 remote 鎴栫壒娈婂垎鏀瓥鐣ワ紝闇€鍦ㄥ璇濋噷棰濆璇存槑銆?- 鑻ュ綋鍓嶅垎鏀瓨鍦ㄦ湭鎻愪氦鏀瑰姩锛岄渶瑕佽嚜鍔ㄦ彁浜ゆ椂锛屾彁浜よ鏄庨粯璁や娇鐢?*涓枃**锛屽苟灏介噺璐村悎瀹為檯鏀瑰姩鏂囦欢鍐呭锛涗笉瑕佸彧鍐欑缁熸弿杩般€?- 鎻愪氦璇存槑搴旈伩鍏嶆満姊板寲琛ㄨ揪锛屼笉瑕佸啓鈥滃皢 A 鍒嗘敮鍚堝苟鍒?B 鍒嗘敮鈥濊繖绫讳笉鑷劧琛ㄨ堪銆?- 鑻ョ敤鎴锋槑纭粰鍑烘彁浜よ鏄庢牸寮忔垨鏂囨锛屼紭鍏堟寜鐢ㄦ埛瑕佹眰鎵ц銆?- 鍦?Windows PowerShell 涓紝閬垮厤鐢ㄧ閬撴妸涓枃鐩存帴浼犵粰 `git commit -F -`锛涜浣跨敤 UTF-8锛堟棤 BOM锛変复鏃舵枃浠朵紶鍏?`-F`锛屼互闄嶄綆涓枃鎻愪氦淇℃伅鍑虹幇涔辩爜锛堝 `??`锛夌殑姒傜巼銆?- `git push` 鎴?`git fetch` 澶辫触鏃跺簲绔嬪嵆鍋滄锛屼笉缁х画 checkout 鎴?merge銆?
### 鍚堝苟鍓?fetch 璇存槑

- `git fetch origin` 鍙洿鏂版湰鍦?`origin/*`锛?*涓?*鏀瑰彉褰撳墠鍒嗘敮涓庡伐浣滃尯銆?- 鍒囨崲鍒?**TargetBranch** 鍚庯紝鑻ユ湰鍦拌惤鍚庝簬 `origin/<TargetBranch>`锛屽厛 `merge origin/<TargetBranch>` 鍐?merge 鍔熻兘鍒嗘敮銆?- **绂佹**鍦?**CurrentBranch** 涓婃墽琛?`git pull origin <TargetBranch>`锛堜細鎶婄洰鏍囧垎鏀悎杩涘姛鑳藉垎鏀紝鏂瑰悜鍙嶄簡锛夈€?- 鏈?Skill **涓嶄娇鐢?* `git pull`锛屼互閬垮厤 `pull.rebase` 绛夐厤缃敼鍙樺悎骞惰涓恒€?- 鑻?`origin/<TargetBranch>` 涓嶅瓨鍦紙渚嬪鏈湴鏂板缓銆佸皻鏈?push 鐨勭洰鏍囧垎鏀級锛岃烦杩囧榻愭楠わ紝鐩存帴 merge 鍔熻兘鍒嗘敮銆?
## Instructions

Follow this workflow when the user provides the **鐩爣鍒嗘敮** (target branch) name, often via `/git-branch-merge-flow 鍚堝苟鍒?鐩爣鍒嗘敮>`:

1. Capture **褰撳墠鍒嗘敮** (current branch) as the branch that will be pushed and merged.
2. Commit pending changes on the current branch (if there are changes), with a Chinese message that reflects the real file-level changes.
3. Push the current branch to its same-named remote branch. **Stop immediately if push fails.**
4. Run `git fetch origin` to update remote-tracking refs. **Stop immediately if fetch fails.**
5. Switch to the target branch. **Stop immediately if checkout fails** (for example, branch does not exist locally).
6. Align the target branch with `origin/<TargetBranch>` when applicable:
   - If `origin/<TargetBranch>` does not exist, skip alignment.
   - If local target is behind `origin/<TargetBranch>`, run `git merge origin/<TargetBranch>`.
   - If local target is already up to date or ahead, skip merge alignment.
   - If alignment merge conflicts, stop on the target branch; do not push; do not switch back.
7. Merge the current branch into the target branch.
8. If merge conflicts happen at any merge step:
   - Stop immediately.
   - Report conflict phase: aligning `origin/<TargetBranch>` or merging `<CurrentBranch>`.
   - List conflict files (for example via `git diff --name-only --diff-filter=U` or `git status --short`).
   - Ask user to resolve or confirm resolution strategy.
   - Do not switch back to the current branch.
   - Do not push the target branch.
9. If all steps succeed:
   - Push the target branch to remote. **Stop immediately if push fails.**
   - Switch back to the current branch.
   - Report success including fetch and target-alignment details.

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
$HadNewCommit = $false
if ((git status --porcelain).Length -gt 0) {
  # Use a Chinese commit message that is close to actual changed files/content.
  # Avoid robotic phrasing like "merge branch A into branch B" in commit message.
  # Adjust the text according to real changes before running.
  $CommitMessage = "瀹屽杽鏂囨。璇存槑涓庢祦绋嬬粏鑺?
  git add .
  # Write commit message with UTF-8 (no BOM) to avoid garbled Chinese in PowerShell.
  $CommitMsgFile = Join-Path (git rev-parse --git-dir) "commit-msg-utf8.txt"
  $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($CommitMsgFile, $CommitMessage, $Utf8NoBom)
  git commit -F $CommitMsgFile
  if ($LASTEXITCODE -ne 0) { exit 1 }
  Remove-Item -Force $CommitMsgFile
  $HadNewCommit = $true
}

# Push current branch to remote with the same name
git push -u origin $CurrentBranch
if ($LASTEXITCODE -ne 0) { exit 1 }

# Fetch origin (updates origin/* only; does not change current branch)
git fetch origin
if ($LASTEXITCODE -ne 0) { exit 1 }

# Switch to target branch
git checkout $TargetBranch
if ($LASTEXITCODE -ne 0) { exit 1 }

# Align target branch with origin/<TargetBranch> when behind
$RemoteRef = "origin/$TargetBranch"
$TargetAligned = "skipped"
$TargetAlignDetail = "杩滅涓嶅瓨鍦?$RemoteRef锛岃烦杩囧榻?
$ConflictPhase = ""

git rev-parse $RemoteRef 2>$null
$RemoteExists = ($LASTEXITCODE -eq 0)

if ($RemoteExists) {
  $Behind = [int](git rev-list --count "$TargetBranch..$RemoteRef")
  $Ahead = [int](git rev-list --count "$RemoteRef..$TargetBranch")

  if ($Behind -gt 0) {
    git merge $RemoteRef
    if ($LASTEXITCODE -ne 0) {
      $ConflictPhase = "align-origin-target"
      Write-Host "Merge conflict while aligning $TargetBranch with $RemoteRef. Stay on $TargetBranch and stop."
      exit 1
    }
    $TargetAligned = "merged"
    $TargetAlignDetail = "宸?merge $RemoteRef锛堣惤鍚?$Behind 涓彁浜わ級"
  } else {
    $TargetAligned = "none"
    if ($Ahead -gt 0) {
      $TargetAlignDetail = "鏈湴棰嗗厛 origin $Ahead 涓彁浜わ紝鏃犻渶瀵归綈"
    } else {
      $TargetAlignDetail = "宸蹭笌 origin 涓€鑷?
    }
  }
}

$OriginTargetSha = ""
if ($RemoteExists) {
  $OriginTargetSha = git rev-parse --short $RemoteRef
}

# Merge current branch into target branch
git merge $CurrentBranch
if ($LASTEXITCODE -ne 0) {
  $ConflictPhase = "merge-current"
  Write-Host "Merge conflict while merging $CurrentBranch into $TargetBranch. Stay on $TargetBranch and stop."
  exit 1
}

# Push target branch and switch back to current branch
git push -u origin $TargetBranch
if ($LASTEXITCODE -ne 0) { exit 1 }

git checkout $CurrentBranch
Write-Host "Done: pushed $CurrentBranch, fetched origin, aligned $TargetBranch ($TargetAligned), merged $CurrentBranch, pushed $TargetBranch, switched back to $CurrentBranch."
Write-Host "娑夊強浠撳簱锛?RepoIdentifier"
```

## Output Requirements

Always report:

- detected **褰撳墠鍒嗘敮** name and **鐩爣鍒嗘敮** name
- whether the current branch had a new commit before push
- fetch status (executed or failed)
- target alignment status (`none` / `merged` / `skipped`) with detail
- feature-branch merge status
- final branch after workflow
- involved repository line in Chinese: `娑夊強浠撳簱锛歕`<repo-identifier>\``
- `<repo-identifier>` must be dynamically detected at runtime (for example from `git remote get-url origin`, or when unavailable, fallback to the git toplevel directory name); never hardcode a fixed repository name in this skill output.

Success case should follow this style:

```text
宸叉寜 /git-branch-merge-flow 鍚堝苟鍒?鐩爣鍒嗘敮> 鎵ц瀹屾垚锛岀粨鏋滃涓嬶細

- 褰撳墠鍒嗘敮锛圕urrentBranch锛夛細`<current-branch>`
- 鐩爣鍒嗘敮锛圱argetBranch锛夛細`<target-branch>`
- 褰撳墠鍒嗘敮鏄惁鍏堜骇鐢熸柊鎻愪氦锛?鏄?鍚?
- 鏂版彁浜わ細`<commit-sha>`锛坄<commit-message>`锛夛紙鑻ユ棤鍒欏啓銆屾棤銆嶏級
- 鍚堝苟鍓?fetch锛氬凡鎵ц锛坥rigin/<target> @ <sha>锛?- 鐩爣鍒嗘敮瀵归綈锛?none | merged | skipped>锛?TargetAlignDetail>锛?- 鍔熻兘鍒嗘敮鍚堝苟锛氭垚鍔燂紙<fast-forward | merge commit>锛宍<current-branch>` 鈫?`<target-branch>`锛?- 鏈€缁堟墍鍦ㄥ垎鏀細`<final-branch>`
- 娑夊強浠撳簱锛歚<repo-identifier>`

宸叉墽琛岀殑鍏抽敭鍔ㄤ綔锛?
- 宸插皢 `<current-branch>` 鎺ㄩ€佸埌杩滅
- 宸叉墽琛?`git fetch origin`
- 宸插垏鎹㈠埌 `<target-branch>` 骞跺榻?`origin/<target-branch>`锛堣嫢闇€瑕侊級
- 宸插悎骞?`<current-branch>` 鍒?`<target-branch>`
- 宸插皢 `<target-branch>` 鎺ㄩ€佸埌杩滅
- 宸插垏鍥?`<current-branch>` 鍒嗘敮
```

Conflict case report must explicitly state:

- merge stopped on the **鐩爣鍒嗘敮**
- did not switch back to the **褰撳墠鍒嗘敮**
- **鐩爣鍒嗘敮** was not pushed
- **鍐茬獊闃舵**锛氬榻?`origin/<target>` 鎴?鍚堝苟 `<current-branch>`
- **鍐茬獊鏂囦欢**锛歚<list>`

## Version Notes

- Current effective version: `1.4.0`
- Default behavior when user does not specify version: use this latest `SKILL.md`.
- Historical snapshots should be kept under `versions/<version>/SKILL.md`.

## Example Prompt

```text
/git-branch-merge-flow 鍚堝苟鍒?鐩爣鍒嗘敮>

绀轰緥锛?/git-branch-merge-flow 鍚堝苟鍒皉elease/yyy
```

# Skills

Agent skills installed into this project (DSH format: `<name>/SKILL.md`).

## Sources

| Source | Skills | License |
|---|---|---|
| [superpowers](https://github.com/obra/superpowers) | 15 | MIT |
| [ponytail](https://github.com/DietrichGebert/ponytail) | 6 | MIT |

## Update

Re-clone a source repo and copy its `skills/*` directories back into `.agents/skills/`:

```powershell
git clone --depth 1 https://github.com/obra/superpowers .tmp-src
Copy-Item .tmp-src\skills\* .agents\skills\ -Recurse -Force
cmd /c "rmdir /s /q .tmp-src"
```

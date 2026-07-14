with open("src/components/sections/AdminCenter.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "        ))} " in line or "        ))}" in line:
        if "px-2 py-1" in lines[i-3] or "px-2 py-1" in lines[i-4] or "px-2 py-1" in lines[i-2] or "app.status" in lines[i-1]:
            lines.insert(i, "          </div>\n")
            break

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.writelines(lines)

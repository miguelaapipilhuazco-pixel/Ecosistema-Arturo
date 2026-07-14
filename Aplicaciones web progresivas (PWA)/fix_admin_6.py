with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

content = content.replace("""        ))}
            </div>
  );
}""", """        ))}
      </div>
    </div>
  );
}""")

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)

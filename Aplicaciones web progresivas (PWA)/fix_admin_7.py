with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

content = content.replace("""              <div className="h-1 bg-muted rounded-full overflow-hidden">
                 <div className="h-full bg-primary" style={{ width: `${90 + i}%` }} />
              </div>
         ))}
            </div>
  );
}""", """              <div className="h-1 bg-muted rounded-full overflow-hidden">
                 <div className="h-full bg-primary" style={{ width: `${90 + i}%` }} />
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}""")

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)

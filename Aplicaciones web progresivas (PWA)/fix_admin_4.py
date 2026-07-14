with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

content = content.replace("""            <div className={`px-2 py-1 rounded text-[7px] font-bold uppercase ${app.status === 'ESTABLE' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
               {app.status}
            </div>
        ))}
            </div>""", """            <div className={`px-2 py-1 rounded text-[7px] font-bold uppercase ${app.status === 'ESTABLE' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
               {app.status}
            </div>
          </div>
        ))}
      </div>
    </div>""")

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)

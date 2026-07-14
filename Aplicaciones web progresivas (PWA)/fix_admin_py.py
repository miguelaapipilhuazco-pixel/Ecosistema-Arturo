import re

with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

# Fix 1: ACCESO_ROOT_CONCEDIDO</div></div>             </div>
content = content.replace("ACCESO_ROOT_CONCEDIDO</div></div>             </div>", "ACCESO_ROOT_CONCEDIDO\n             </div>\n          </div>")

# Fix 2: CENTRO DE ADMINISTRACIÓN
content = content.replace("{t(\"CENTRO DE ADMINISTRACIÓN\")}\n            </p>\n          </div>\n      </header>", "{t(\"CENTRO DE ADMINISTRACIÓN\")}\n            </p>\n          </div>\n        </div>\n      </header>")

content = content.replace("<LogoOS className=\"w-10 h-10 text-primary\" />\n            </div>\n          <div>", "<LogoOS className=\"w-10 h-10 text-primary\" />\n            </div>\n          </div>\n          <div>")

content = content.replace("<LogoOS className=\"w-5 h-5 text-primary opacity-60 group-hover:opacity-100\" />\n                </div>\n              <div>", "<LogoOS className=\"w-5 h-5 text-primary opacity-60 group-hover:opacity-100\" />\n                </div>\n              </div>\n              <div>")

# Fix bottom
content = content.replace("""      </div>
    </div>
    </div>
  );
}
  switch (id) {""", """      </div>
    </div>
  );
}
function renderizarSubseccion(id: SubseccionAdmin, t: any) {
  switch (id) {""")

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)

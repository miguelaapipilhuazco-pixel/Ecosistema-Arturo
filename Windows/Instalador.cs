using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace EcosistemaArturo
{
    class Instalador
    {
        [STAThread]
        static void Main(string[] args)
        {
            string installPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "EcosistemaArturo"
            );

            // Comprobar si se solicita desinstalación
            if (args.Length > 0 && args[0].ToLower() == "/uninstall")
            {
                EjecutarDesinstalacion(installPath);
                return;
            }

            EjecutarInstalacion(installPath);
        }

        static void EjecutarInstalacion(string installPath)
        {
            try
            {
                // Diálogo de bienvenida
                DialogResult dialogResult = MessageBox.Show(
                    "Bienvenido al Instalador de Ecosistema Arturo.\n\n¿Desea instalar la aplicación en su sistema local?\n\nRuta: " + installPath,
                    "Instalación de Ecosistema Arturo",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Information
                );

                if (dialogResult == DialogResult.No)
                {
                    return;
                }

                // 1. Crear directorio de instalación
                if (!Directory.Exists(installPath))
                {
                    Directory.CreateDirectory(installPath);
                }

                // 2. Copiar archivos recursivamente
                string appDir = AppDomain.CurrentDomain.BaseDirectory;
                // Buscar el directorio origen de la PWA
                string sourcePwa = Path.Combine(appDir, @"..\Aplicaciones web progresivas (PWA)");
                if (!Directory.Exists(sourcePwa))
                {
                    sourcePwa = Path.Combine(appDir, "Aplicaciones web progresivas (PWA)");
                }

                if (Directory.Exists(sourcePwa))
                {
                    CopiarDirectorio(sourcePwa, Path.Combine(installPath, "Aplicaciones web progresivas (PWA)"));
                }
                else
                {
                    MessageBox.Show("Error: No se encontraron los archivos origen de la aplicación web progresiva (PWA). Asegúrese de no separar el instalador del directorio del proyecto.", "Error de Instalación", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // 3. Copiar el Lanzador y el propio Instalador (como desinstalador)
                string sourceLauncher = Path.Combine(appDir, "Lanzador.exe");
                if (File.Exists(sourceLauncher))
                {
                    File.Copy(sourceLauncher, Path.Combine(installPath, "EcosistemaArturo.exe"), true);
                }

                // Copiar el instalador actual para que sirva de desinstalador
                string currentExe = System.Reflection.Assembly.GetExecutingAssembly().Location;
                File.Copy(currentExe, Path.Combine(installPath, "Desinstalador.exe"), true);

                // 4. Crear accesos directos usando PowerShell
                CrearAccesosDirectos(installPath);

                MessageBox.Show(
                    "¡Instalación completada exitosamente!\n\nSe han creado los accesos directos en el Escritorio y en el Menú Inicio para arrancar el Ecosistema Arturo al instante.",
                    "Instalación Completada",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );

                // Iniciar la aplicación de inmediato
                string targetLauncher = Path.Combine(installPath, "EcosistemaArturo.exe");
                if (File.Exists(targetLauncher))
                {
                    Process.Start(targetLauncher);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Ocurrió un error durante la instalación: " + ex.Message, "Error de Instalación", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void EjecutarDesinstalacion(string installPath)
        {
            try
            {
                DialogResult dialogResult = MessageBox.Show(
                    "¿Está seguro de que desea desinstalar por completo el Ecosistema Arturo de su equipo?",
                    "Desinstalación de Ecosistema Arturo",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Warning
                );

                if (dialogResult == DialogResult.No)
                {
                    return;
                }

                // 1. Eliminar accesos directos usando PowerShell
                EliminarAccesosDirectos();

                // 2. Eliminar directorio de instalación (con un script secundario o de inmediato)
                // Para eliminar la carpeta en ejecución, iniciamos un proceso cmd.exe que espere y borre
                string cmdArgs = "/c timeout /t 1 /nobreak && rd /s /q \"" + installPath + "\"";
                ProcessStartInfo startInfo = new ProcessStartInfo();
                startInfo.FileName = "cmd.exe";
                startInfo.Arguments = cmdArgs;
                startInfo.CreateNoWindow = true;
                startInfo.UseShellExecute = false;
                startInfo.WindowStyle = ProcessWindowStyle.Hidden;
                Process.Start(startInfo);

                MessageBox.Show(
                    "El Ecosistema Arturo ha sido desinstalado de su equipo correctamente.",
                    "Desinstalación Completada",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
            catch (Exception ex)
            {
                MessageBox.Show("Ocurrió un error al desinstalar: " + ex.Message, "Error de Desinstalación", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void CopiarDirectorio(string origen, string destino)
        {
            Directory.CreateDirectory(destino);
            foreach (string file in Directory.GetFiles(origen))
            {
                string destFile = Path.Combine(destino, Path.GetFileName(file));
                File.Copy(file, destFile, true);
            }
            foreach (string folder in Directory.GetDirectories(origen))
            {
                // Ignorar carpetas pesadas temporales o dependencias si no son necesarias
                string name = Path.GetFileName(folder);
                if (name == "node_modules" || name == ".git" || name == ".gemini")
                {
                    continue;
                }
                string destFolder = Path.Combine(destino, name);
                CopiarDirectorio(folder, destFolder);
            }
        }

        static void CrearAccesosDirectos(string installPath)
        {
            string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string startMenuPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");

            string exePath = Path.Combine(installPath, "EcosistemaArturo.exe");
            string uninstallExePath = Path.Combine(installPath, "Desinstalador.exe");

            // Script de PowerShell para crear accesos directos
            string psScript = 
                "$WshShell = New-Object -ComObject WScript.Shell; " +
                "$Shortcut = $WshShell.CreateShortcut('" + Path.Combine(desktopPath, "Ecosistema Arturo.lnk") + "'); " +
                "$Shortcut.TargetPath = '" + exePath + "'; " +
                "$Shortcut.WorkingDirectory = '" + installPath + "'; " +
                "$Shortcut.Save(); " +
                
                "$ShortcutMenu = $WshShell.CreateShortcut('" + Path.Combine(startMenuPath, "Ecosistema Arturo.lnk") + "'); " +
                "$ShortcutMenu.TargetPath = '" + exePath + "'; " +
                "$ShortcutMenu.WorkingDirectory = '" + installPath + "'; " +
                "$ShortcutMenu.Save(); " +

                "$ShortcutUn = $WshShell.CreateShortcut('" + Path.Combine(startMenuPath, "Desinstalar Ecosistema Arturo.lnk") + "'); " +
                "$ShortcutUn.TargetPath = '" + uninstallExePath + "'; " +
                "$ShortcutUn.Arguments = '/uninstall'; " +
                "$ShortcutUn.WorkingDirectory = '" + installPath + "'; " +
                "$ShortcutUn.Save();";

            EjecutarPowerShell(psScript);
        }

        static void EliminarAccesosDirectos()
        {
            string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string startMenuPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");

            string lnk1 = Path.Combine(desktopPath, "Ecosistema Arturo.lnk");
            string lnk2 = Path.Combine(startMenuPath, "Ecosistema Arturo.lnk");
            string lnk3 = Path.Combine(startMenuPath, "Desinstalar Ecosistema Arturo.lnk");

            if (File.Exists(lnk1)) File.Delete(lnk1);
            if (File.Exists(lnk2)) File.Delete(lnk2);
            if (File.Exists(lnk3)) File.Delete(lnk3);
        }

        static void EjecutarPowerShell(string script)
        {
            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.FileName = "powershell.exe";
            startInfo.Arguments = "-NoProfile -Command \"" + script + "\"";
            startInfo.CreateNoWindow = true;
            startInfo.UseShellExecute = false;
            startInfo.WindowStyle = ProcessWindowStyle.Hidden;
            
            using (Process p = Process.Start(startInfo))
            {
                p.WaitForExit();
            }
        }
    }
}

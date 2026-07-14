import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import crypto from "crypto";
import { spawn } from "child_process";
import { execFileSync } from "child_process";
import { exec } from "child_process";

interface LocalAppItem {
  name: string;
  path: string;
  type: "app" | "program" | "game";
  source: string;
}

interface LocalDeviceItem {
  name: string;
  path: string;
  type: "app" | "program" | "game" | "folder" | "file";
  source: string;
  size?: number;
}

interface RuntimeVmItem {
  name: string;
  provider: "hyperv" | "virtualbox" | "vmware" | "generic";
  path?: string;
  state?: string;
  source: "scan" | "hyperv-command";
}

async function walkFilesLimited(rootDir: string, maxDepth: number, allowedExt: Set<string>, out: string[] = [], depth = 0): Promise<string[]> {
  if (depth > maxDepth || out.length >= 1500) {
    return out;
  }

  try {
    const entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
    for (const entry of entries) {
      if (out.length >= 1500) {
        break;
      }

      const fullPath = path.join(rootDir, entry.name);
      if (entry.isDirectory()) {
        await walkFilesLimited(fullPath, maxDepth, allowedExt, out, depth + 1);
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (allowedExt.has(extension)) {
        out.push(fullPath);
      }
    }
  } catch {
    // Ignore inaccessible directories.
  }

  return out;
}

function classifyLocalApp(fileName: string, filePath: string): "app" | "program" | "game" {
  const text = `${fileName} ${filePath}`.toLowerCase();
  if (/(steam|epic|gog|battle\.net|riot|minecraft|game|uplay|origin)/i.test(text)) {
    return "game";
  }

  if (/(browser|chrome|edge|firefox|brave|discord|spotify|teams|zoom|vscode|photoshop|obs)/i.test(text)) {
    return "app";
  }

  return "program";
}

async function listWindowsLocalApps(limit = 400): Promise<LocalAppItem[]> {
  if (process.platform !== "win32") {
    return [];
  }

  const roots: Array<{ dir: string; depth: number; source: string }> = [];
  const programData = process.env.ProgramData;
  const appData = process.env.APPDATA;
  const userProfile = process.env.USERPROFILE;
  const publicDir = process.env.PUBLIC;
  const programFiles = process.env.ProgramFiles;
  const programFilesX86 = process.env["ProgramFiles(x86)"];

  if (programData) {
    roots.push({ dir: path.join(programData, "Microsoft", "Windows", "Start Menu", "Programs"), depth: 4, source: "StartMenuGlobal" });
  }
  if (appData) {
    roots.push({ dir: path.join(appData, "Microsoft", "Windows", "Start Menu", "Programs"), depth: 4, source: "StartMenuUser" });
  }
  if (userProfile) {
    roots.push({ dir: path.join(userProfile, "Desktop"), depth: 2, source: "DesktopUser" });
  }
  if (publicDir) {
    roots.push({ dir: path.join(publicDir, "Desktop"), depth: 2, source: "DesktopPublic" });
  }
  if (programFiles) {
    roots.push({ dir: programFiles, depth: 2, source: "ProgramFiles" });
  }
  if (programFilesX86) {
    roots.push({ dir: programFilesX86, depth: 2, source: "ProgramFilesX86" });
  }

  const allowedExtensions = new Set([".lnk", ".exe", ".url"]);
  const dedup = new Map<string, LocalAppItem>();

  for (const root of roots) {
    const files = await walkFilesLimited(root.dir, root.depth, allowedExtensions);
    for (const fullPath of files) {
      if (dedup.size >= limit) {
        break;
      }

      const rawName = path.basename(fullPath, path.extname(fullPath)).trim();
      if (!rawName) {
        continue;
      }

      const normalizedKey = rawName.toLowerCase();
      if (dedup.has(normalizedKey)) {
        continue;
      }

      dedup.set(normalizedKey, {
        name: rawName,
        path: fullPath,
        type: classifyLocalApp(rawName, fullPath),
        source: root.source,
      });
    }

    if (dedup.size >= limit) {
      break;
    }
  }

  return Array.from(dedup.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function queryWindowsUninstallDisplayNames(rootKey: string): Array<{ name: string; installLocation?: string; displayIcon?: string }> {
  if (process.platform !== "win32") {
    return [];
  }

  try {
    const output = execFileSync("reg.exe", ["query", rootKey, "/s"], {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 8000,
    });

    const lines = output.split(/\r?\n/);
    const rows: Array<{ name: string; installLocation?: string; displayIcon?: string }> = [];
    let currentName = "";
    let currentLocation = "";
    let currentIcon = "";

    const flush = () => {
      const name = currentName.trim();
      if (name) {
        rows.push({
          name,
          installLocation: currentLocation.trim() || undefined,
          displayIcon: currentIcon.trim() || undefined,
        });
      }
      currentName = "";
      currentLocation = "";
      currentIcon = "";
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.startsWith("HKEY_")) {
        flush();
        continue;
      }

      if (trimmed.includes("DisplayName") && trimmed.includes("REG_")) {
        const value = trimmed.split(/\s{2,}/).pop() || "";
        currentName = value;
        continue;
      }

      if (trimmed.includes("InstallLocation") && trimmed.includes("REG_")) {
        const value = trimmed.split(/\s{2,}/).pop() || "";
        currentLocation = value;
        continue;
      }

      if (trimmed.includes("DisplayIcon") && trimmed.includes("REG_")) {
        const value = trimmed.split(/\s{2,}/).pop() || "";
        currentIcon = value;
      }
    }

    flush();
    return rows;
  } catch {
    return [];
  }
}

function listWindowsAppsFromRegistry(limit = 1200): LocalAppItem[] {
  if (process.platform !== "win32") {
    return [];
  }

  const roots = [
    "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
  ];

  const dedup = new Map<string, LocalAppItem>();
  for (const root of roots) {
    const rows = queryWindowsUninstallDisplayNames(root);
    for (const row of rows) {
      if (dedup.size >= limit) {
        break;
      }

      const name = String(row.name || "").trim();
      if (!name) {
        continue;
      }

      const key = name.toLowerCase();
      if (dedup.has(key)) {
        continue;
      }

      const pathHint = String(row.installLocation || row.displayIcon || "").trim();
      dedup.set(key, {
        name,
        path: pathHint,
        type: classifyLocalApp(name, pathHint),
        source: "WindowsRegistry",
      });
    }
  }

  return Array.from(dedup.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function readTextFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function extractSteamLibraryPaths(steamRoot: string): string[] {
  const libraries = new Set<string>();
  libraries.add(steamRoot);

  const libraryVdf = path.join(steamRoot, "steamapps", "libraryfolders.vdf");
  const raw = readTextFileSafe(libraryVdf);
  if (!raw) {
    return Array.from(libraries);
  }

  const regex = /"path"\s+"([^"]+)"/g;
  let match: RegExpExecArray | null = regex.exec(raw);
  while (match) {
    const rawPath = String(match[1] || "").trim();
    if (rawPath) {
      libraries.add(rawPath.replace(/\\\\/g, "\\"));
    }
    match = regex.exec(raw);
  }

  return Array.from(libraries);
}

function listSteamGamesFromManifests(limit = 500): LocalAppItem[] {
  if (process.platform !== "win32") {
    return [];
  }

  const steamRoots: string[] = [];
  const programFilesX86 = process.env["ProgramFiles(x86)"];
  const programFiles = process.env.ProgramFiles;
  const userProfile = process.env.USERPROFILE;

  if (programFilesX86) steamRoots.push(path.join(programFilesX86, "Steam"));
  if (programFiles) steamRoots.push(path.join(programFiles, "Steam"));
  if (userProfile) steamRoots.push(path.join(userProfile, "AppData", "Local", "Steam"));

  const dedup = new Map<string, LocalAppItem>();

  for (const steamRoot of steamRoots) {
    if (!fs.existsSync(steamRoot)) {
      continue;
    }

    const libraries = extractSteamLibraryPaths(steamRoot);
    for (const libraryRoot of libraries) {
      const steamAppsDir = path.join(libraryRoot, "steamapps");
      if (!fs.existsSync(steamAppsDir)) {
        continue;
      }

      let entries: string[] = [];
      try {
        entries = fs.readdirSync(steamAppsDir);
      } catch {
        entries = [];
      }

      for (const entry of entries) {
        if (dedup.size >= limit) {
          break;
        }

        if (!/^appmanifest_\d+\.acf$/i.test(entry)) {
          continue;
        }

        const manifestPath = path.join(steamAppsDir, entry);
        const raw = readTextFileSafe(manifestPath);
        if (!raw) {
          continue;
        }

        const nameMatch = /"name"\s+"([^"]+)"/i.exec(raw);
        const installDirMatch = /"installdir"\s+"([^"]+)"/i.exec(raw);
        const name = String(nameMatch?.[1] || "").trim();
        if (!name) {
          continue;
        }

        const installDir = String(installDirMatch?.[1] || "").trim();
        const gamePath = installDir
          ? path.join(libraryRoot, "steamapps", "common", installDir)
          : manifestPath;

        const key = `${name.toLowerCase()}|${gamePath.toLowerCase()}`;
        if (!dedup.has(key)) {
          dedup.set(key, {
            name,
            path: gamePath,
            type: "game",
            source: "SteamManifest",
          });
        }
      }
    }
  }

  return Array.from(dedup.values());
}

function listEpicGamesFromManifests(limit = 300): LocalAppItem[] {
  if (process.platform !== "win32") {
    return [];
  }

  const programData = process.env.ProgramData;
  if (!programData) {
    return [];
  }

  const manifestsDir = path.join(programData, "Epic", "EpicGamesLauncher", "Data", "Manifests");
  if (!fs.existsSync(manifestsDir)) {
    return [];
  }

  const dedup = new Map<string, LocalAppItem>();
  let files: string[] = [];
  try {
    files = fs.readdirSync(manifestsDir);
  } catch {
    files = [];
  }

  for (const fileName of files) {
    if (dedup.size >= limit) {
      break;
    }

    if (!fileName.toLowerCase().endsWith(".item")) {
      continue;
    }

    const filePath = path.join(manifestsDir, fileName);
    const raw = readTextFileSafe(filePath);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      const name = String(parsed?.DisplayName || parsed?.AppName || "").trim();
      if (!name) {
        continue;
      }

      const installPath = String(parsed?.InstallLocation || parsed?.LaunchExecutable || filePath).trim();
      const key = `${name.toLowerCase()}|${installPath.toLowerCase()}`;
      if (!dedup.has(key)) {
        dedup.set(key, {
          name,
          path: installPath,
          type: "game",
          source: "EpicManifest",
        });
      }
    } catch {
      // Ignore malformed manifest files.
    }
  }

  return Array.from(dedup.values());
}

function listMinecraftEntries(): LocalAppItem[] {
  if (process.platform !== "win32") {
    return [];
  }

  const out: LocalAppItem[] = [];
  const userProfile = process.env.USERPROFILE;
  const appData = process.env.APPDATA;
  const programFilesX86 = process.env["ProgramFiles(x86)"];

  if (userProfile) {
    const launcherPath = path.join(userProfile, "AppData", "Roaming", "Microsoft", "Windows", "Start Menu", "Programs", "Minecraft Launcher.lnk");
    if (fs.existsSync(launcherPath)) {
      out.push({
        name: "Minecraft Launcher",
        path: launcherPath,
        type: "game",
        source: "Minecraft",
      });
    }
  }

  if (appData) {
    const minecraftProfile = path.join(appData, ".minecraft");
    if (fs.existsSync(minecraftProfile)) {
      out.push({
        name: "Minecraft",
        path: minecraftProfile,
        type: "game",
        source: "Minecraft",
      });
    }
  }

  if (programFilesX86) {
    const minecraftLauncherExe = path.join(programFilesX86, "Minecraft Launcher", "MinecraftLauncher.exe");
    if (fs.existsSync(minecraftLauncherExe)) {
      out.push({
        name: "Minecraft Launcher",
        path: minecraftLauncherExe,
        type: "game",
        source: "Minecraft",
      });
    }
  }

  return out;
}

async function listAutomaticDeviceCatalog(maxApps = 2500): Promise<LocalDeviceItem[]> {
  const startMenuApps = await listWindowsLocalApps(maxApps);
  const registryApps = listWindowsAppsFromRegistry(maxApps);
  const steamGames = listSteamGamesFromManifests(Math.min(1000, maxApps));
  const epicGames = listEpicGamesFromManifests(Math.min(600, maxApps));
  const minecraftEntries = listMinecraftEntries();
  const vms = await listRuntimeVirtualMachines();

  const dedup = new Map<string, LocalDeviceItem>();

  [...steamGames, ...epicGames, ...minecraftEntries, ...registryApps, ...startMenuApps].forEach((item) => {
    const key = `${item.type}|${item.name.toLowerCase()}|${String(item.path || "").toLowerCase()}`;
    if (!dedup.has(key)) {
      dedup.set(key, {
        name: item.name,
        path: item.path,
        type: item.type,
        source: item.source,
      });
    }
  });

  vms.forEach((vm) => {
    const key = `vm|${vm.name.toLowerCase()}|${String(vm.path || "").toLowerCase()}`;
    if (!dedup.has(key)) {
      dedup.set(key, {
        name: vm.name,
        path: String(vm.path || vm.name || ""),
        type: "program",
        source: `VM:${vm.provider}`,
      });
    }
  });

  const prioritized = Array.from(dedup.values()).sort((a, b) => {
    const rank = (value: LocalDeviceItem) => {
      if (value.type === "game") return 0;
      if (value.type === "app") return 1;
      if (value.type === "program") return 2;
      return 3;
    };
    const diff = rank(a) - rank(b);
    if (diff !== 0) {
      return diff;
    }
    return a.name.localeCompare(b.name);
  });

  return prioritized.slice(0, Math.max(1, maxApps));
}

function listExistingWindowsDrives(): string[] {
  if (process.platform !== "win32") {
    return [];
  }

  const drives: string[] = [];
  for (let code = 67; code <= 90; code += 1) {
    const letter = String.fromCharCode(code);
    const root = `${letter}:\\`;
    try {
      if (fs.existsSync(root)) {
        drives.push(root);
      }
    } catch {
      // Ignore inaccessible drive letters.
    }
  }
  return drives;
}

function classifyDeviceFile(fileName: string, fullPath: string): "app" | "program" | "game" | "file" {
  const lower = `${fileName} ${fullPath}`.toLowerCase();
  if (/(steam|epic|gog|battle\.net|riot|minecraft|game|uplay|origin)/i.test(lower)) {
    return "game";
  }
  if (/(chrome|edge|firefox|brave|discord|spotify|teams|zoom|vscode|photoshop|obs|notion)/i.test(lower)) {
    return "app";
  }

  const extension = path.extname(fileName).toLowerCase();
  if ([".exe", ".lnk", ".url", ".appref-ms", ".bat", ".cmd", ".msi"].includes(extension)) {
    return "program";
  }

  return "file";
}

async function walkDeviceEntries(
  rootDir: string,
  maxDepth: number,
  maxItems: number,
  out: LocalDeviceItem[],
  depth = 0
): Promise<void> {
  if (depth > maxDepth || out.length >= maxItems) {
    return;
  }

  let entries: fs.Dirent[] = [];
  try {
    entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (out.length >= maxItems) {
      break;
    }

    if (entry.name.startsWith("$") || entry.name === "System Volume Information") {
      continue;
    }

    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      out.push({
        name: entry.name,
        path: fullPath,
        type: "folder",
        source: "DeviceScan",
      });
      await walkDeviceEntries(fullPath, maxDepth, maxItems, out, depth + 1);
      continue;
    }

    const type = classifyDeviceFile(entry.name, fullPath);
    let size = 0;
    try {
      const stat = await fs.promises.stat(fullPath);
      size = Number(stat.size || 0);
    } catch {
      size = 0;
    }

    out.push({
      name: entry.name,
      path: fullPath,
      type,
      source: "DeviceScan",
      size,
    });
  }
}

async function listWindowsDeviceItems(maxItems = 8000, maxDepth = 4): Promise<LocalDeviceItem[]> {
  if (process.platform !== "win32") {
    return [];
  }

  const out: LocalDeviceItem[] = [];

  const priorityRoots: string[] = [];
  const programFiles = process.env.ProgramFiles;
  const programFilesX86 = process.env["ProgramFiles(x86)"];
  const programData = process.env.ProgramData;
  const appData = process.env.APPDATA;
  const userProfile = process.env.USERPROFILE;

  if (programFiles) priorityRoots.push(programFiles);
  if (programFilesX86) priorityRoots.push(programFilesX86);
  if (programData) priorityRoots.push(path.join(programData, "Microsoft", "Windows", "Start Menu", "Programs"));
  if (appData) priorityRoots.push(path.join(appData, "Microsoft", "Windows", "Start Menu", "Programs"));
  if (userProfile) priorityRoots.push(path.join(userProfile, "Desktop"));

  for (const root of priorityRoots) {
    if (out.length >= maxItems) {
      break;
    }
    await walkDeviceEntries(root, Math.max(2, maxDepth), maxItems, out, 0);
  }

  const drives = listExistingWindowsDrives();
  for (const driveRoot of drives) {
    if (out.length >= maxItems) {
      break;
    }
    await walkDeviceEntries(driveRoot, maxDepth, maxItems, out, 0);
  }

  const dedup = new Map<string, LocalDeviceItem>();
  for (const item of out) {
    const key = `${item.type}|${item.path.toLowerCase()}`;
    if (!dedup.has(key)) {
      dedup.set(key, item);
    }
  }

  return Array.from(dedup.values()).sort((a, b) => a.name.localeCompare(b.name));
}

type SyncDoc = Record<string, any>;
type SyncCollection = Record<string, SyncDoc>;
type SyncData = Record<string, SyncCollection>;

interface AccountSyncState {
  accountId: string;
  data: SyncData;
  devices: Record<string, { lastSeenAt: number }>;
  pairingKeyHash?: string;
  sessions?: Record<string, { deviceId: string; issuedAt: number; lastSeenAt: number; revoked?: boolean }>;
  updatedAt: number;
}

interface SyncStoreShape {
  accounts: Record<string, AccountSyncState>;
}

const SYNC_STORE_FILE = path.join(process.cwd(), ".oss-sync-store.json");

function loadSyncStore(): SyncStoreShape {
  try {
    if (!fs.existsSync(SYNC_STORE_FILE)) {
      return { accounts: {} };
    }
    const parsed = JSON.parse(fs.readFileSync(SYNC_STORE_FILE, "utf8"));
    if (parsed && typeof parsed === "object" && parsed.accounts) {
      return parsed;
    }
  } catch {
    return { accounts: {} };
  }
  return { accounts: {} };
}

function saveSyncStore(store: SyncStoreShape) {
  fs.writeFileSync(SYNC_STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function mergeSyncData(base: SyncData, incoming: SyncData): SyncData {
  const merged: SyncData = { ...base };
  const collectionNames = new Set<string>([...Object.keys(base || {}), ...Object.keys(incoming || {})]);

  collectionNames.forEach((collectionName) => {
    const left = base?.[collectionName] || {};
    const right = incoming?.[collectionName] || {};
    const out: SyncCollection = { ...left };

    Object.entries(right).forEach(([docId, rightDoc]) => {
      const leftDoc = out[docId];
      const leftTs = Number(leftDoc?.__updatedAt || 0);
      const rightTs = Number((rightDoc as any)?.__updatedAt || 0);

      if (!leftDoc || rightTs >= leftTs) {
        out[docId] = rightDoc as SyncDoc;
      }
    });

    merged[collectionName] = out;
  });

  return merged;
}

function hashPairingKey(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function isAbsoluteWindowsPath(value: string): boolean {
  return /^[a-zA-Z]:\\/.test(value);
}

async function walkVmFiles(rootDir: string, maxDepth: number, out: RuntimeVmItem[], depth = 0): Promise<void> {
  if (depth > maxDepth || out.length >= 2000) {
    return;
  }

  let entries: fs.Dirent[] = [];
  try {
    entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (out.length >= 2000) {
      break;
    }

    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      await walkVmFiles(fullPath, maxDepth, out, depth + 1);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (![".vmx", ".vbox", ".vmcx", ".vhdx"].includes(ext)) {
      continue;
    }

    const name = path.basename(entry.name, ext) || entry.name;
    const provider: RuntimeVmItem["provider"] =
      ext === ".vbox" ? "virtualbox" :
      ext === ".vmx" ? "vmware" :
      ext === ".vmcx" ? "hyperv" :
      ext === ".vhdx" ? "hyperv" :
      "generic";

    out.push({
      name,
      provider,
      path: fullPath,
      source: "scan",
    });
  }
}

function readHyperVByCommand(): RuntimeVmItem[] {
  if (process.platform !== "win32") {
    return [];
  }

  try {
    const cmd = "Get-VM | Select-Object Name,State | ConvertTo-Json -Depth 3";
    const raw = execFileSync("powershell.exe", ["-NoProfile", "-Command", cmd], {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows
      .map((row: any) => ({
        name: String(row?.Name || "").trim(),
        state: String(row?.State || "").trim(),
      }))
      .filter((row: any) => row.name)
      .map((row: any) => ({
        name: row.name,
        state: row.state || "Unknown",
        provider: "hyperv" as const,
        source: "hyperv-command" as const,
      }));
  } catch {
    return [];
  }
}

async function listRuntimeVirtualMachines(): Promise<RuntimeVmItem[]> {
  if (process.platform !== "win32") {
    return [];
  }

  const roots: string[] = [];
  const userProfile = process.env.USERPROFILE;
  const publicDir = process.env.PUBLIC;
  const programData = process.env.ProgramData;

  if (userProfile) {
    roots.push(path.join(userProfile, "VirtualBox VMs"));
    roots.push(path.join(userProfile, "Documents", "Virtual Machines"));
    roots.push(path.join(userProfile, "Documents", "Hyper-V"));
  }
  if (publicDir) {
    roots.push(path.join(publicDir, "Documents", "Hyper-V"));
  }
  if (programData) {
    roots.push(path.join(programData, "Microsoft", "Windows", "Hyper-V"));
  }

  const scanned: RuntimeVmItem[] = [];
  for (const root of roots) {
    await walkVmFiles(root, 5, scanned);
  }

  const hyperv = readHyperVByCommand();
  const all = [...hyperv, ...scanned];
  const dedup = new Map<string, RuntimeVmItem>();
  all.forEach((item) => {
    const key = `${item.provider}|${item.name.toLowerCase()}|${String(item.path || "").toLowerCase()}`;
    if (!dedup.has(key)) {
      dedup.set(key, item);
    }
  });

  return Array.from(dedup.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getBearerToken(req: express.Request): string {
  const raw = String(req.headers.authorization || "");
  if (!raw.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return raw.slice(7).trim();
}

function validateSyncSession(req: express.Request, res: express.Response, accountId: string, deviceId: string): { account: AccountSyncState; token: string } | null {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Token requerido" });
    return null;
  }

  const store = loadSyncStore();
  const account = store.accounts[accountId];
  if (!account || !account.sessions || !account.sessions[token]) {
    res.status(401).json({ error: "Sesion invalida" });
    return null;
  }

  const session = account.sessions[token];
  if (session.revoked || session.deviceId !== deviceId) {
    res.status(401).json({ error: "Sesion no autorizada para este dispositivo" });
    return null;
  }

  session.lastSeenAt = Date.now();
  account.updatedAt = Date.now();
  store.accounts[accountId] = account;
  saveSyncStore(store);

  return { account, token };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  app.use(cors());

  const gitAutoPushStatus = {
    enabled: true,
    isHealthy: true,
    lastCheckAt: null as number | null,
    lastPushAt: null as number | null,
    lastSuccessAt: null as number | null,
    lastError: null as string | null,
    lastCommitMessage: null as string | null,
    consecutiveFailures: 0,
    nextRetryInMs: 90000,
  };

  // Servir instalables y archivos de plataforma del directorio raíz del proyecto (padre de Aplicaciones web progresivas)
  const rootProjectDir = path.resolve(process.cwd()); // Nota: En desarrollo/produccion process.cwd() apunta a la carpeta de la PWA
  const parentProjectDir = path.dirname(rootProjectDir); // Carpeta raiz del Ecosistema Arturo
  
  app.use((req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    if (ext === ".bat" || ext === ".sh" || ext === ".apk" || ext === ".zip") {
      const filename = path.basename(req.path);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/octet-stream");
    }
    next();
  });

  // Exponer las carpetas de instaladores del directorio raíz del ecosistema
  app.use("/Windows", express.static(path.join(parentProjectDir, "Windows")));
  app.use("/Linux", express.static(path.join(parentProjectDir, "Linux")));
  app.use("/macOS", express.static(path.join(parentProjectDir, "macOS")));
  app.use("/Android", express.static(path.join(parentProjectDir, "Android")));
  app.use("/VR_MR", express.static(path.join(parentProjectDir, "VR_MR")));
  app.use("/iOS", express.static(path.join(parentProjectDir, "iOS")));
  
  // Servir el Instalador Universal
  app.get("/instalador", (req, res) => {
    res.sendFile(path.join(parentProjectDir, "Instalador Universal.html"));
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/git/auto-push-status", (req, res) => {
    res.json({ ...gitAutoPushStatus, now: Date.now() });
  });

  // Endpoint para resolver el nombre real desde el correo electrónico
  // Intenta: 1) Gravatar, 2) Microsoft Graph (con token), 3) devuelve null
  app.get("/api/resolve-name", async (req: any, res: any) => {
    const email = String(req.query.email || "").trim().toLowerCase();
    const msToken = String(req.query.msToken || "").trim();

    if (!email) return res.json({ name: null, source: null });

    // --- Fuente 1: Microsoft Graph (si se provee token OAuth de Microsoft) ---
    if (msToken) {
      try {
        const graphRes = await fetch(
          `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}?$select=displayName,givenName,surname`,
          { headers: { Authorization: `Bearer ${msToken}`, "Content-Type": "application/json" } }
        );
        if (graphRes.ok) {
          const graphData: any = await graphRes.json();
          const nombre = graphData?.displayName || `${graphData?.givenName || ""} ${graphData?.surname || ""}`.trim();
          if (nombre) return res.json({ name: nombre, source: "microsoft" });
        }
      } catch (_) {}
    }

    // --- Fuente 2: Gravatar (búsqueda por hash MD5 del correo) ---
    try {
      const hash = crypto.createHash("md5").update(email).digest("hex");
      const gravatarRes = await fetch(`https://www.gravatar.com/${hash}.json`, {
        headers: { "User-Agent": "EcosistemaArturo/1.0" }
      });
      if (gravatarRes.ok) {
        const gravatarData: any = await gravatarRes.json();
        const entry = gravatarData?.entry?.[0];
        const nombre = entry?.displayName || entry?.name?.formatted ||
          `${entry?.name?.givenName || ""} ${entry?.name?.familyName || ""}`.trim();
        if (nombre) return res.json({ name: nombre, source: "gravatar" });
      }
    } catch (_) {}

    // --- Sin resultado: el frontend mostrará el modal para ingresar el nombre ---
    return res.json({ name: null, source: null });
  });

  app.use(express.json());

  app.post("/api/runtime/launch-local", (req, res) => {
    const rawPath = String(req.body?.path || "").trim();
    if (!rawPath) {
      res.status(400).json({ ok: false, error: "path es requerido" });
      return;
    }

    if (process.platform !== "win32") {
      res.status(400).json({ ok: false, error: "Lanzamiento local implementado para Windows en esta version" });
      return;
    }

    try {
      const targetPath = rawPath.replace(/\//g, "\\");
      const isGlobalCmd = targetPath.toLowerCase() === "code" || targetPath.toLowerCase() === "agy";

      if (!isGlobalCmd) {
        if (!isAbsoluteWindowsPath(targetPath)) {
          res.status(400).json({ ok: false, error: "Ruta invalida para lanzamiento local" });
          return;
        }

        if (!fs.existsSync(targetPath)) {
          res.status(404).json({ ok: false, error: "No existe la ruta indicada" });
          return;
        }

        const stats = fs.statSync(targetPath);
        if (stats.isDirectory()) {
          const proc = spawn("explorer.exe", [targetPath], {
            detached: true,
            stdio: "ignore",
            windowsHide: true,
          });
          proc.unref();
          res.json({ ok: true, launched: true, mode: "folder", path: targetPath });
          return;
        }

        const ext = path.extname(targetPath).toLowerCase();
        const allowed = new Set([".exe", ".lnk", ".url", ".appref-ms", ".bat", ".cmd", ".msc", ".ps1"]);
        if (!allowed.has(ext)) {
          res.status(400).json({ ok: false, error: `Extension no permitida: ${ext}` });
          return;
        }
      }

      const cmdPath = targetPath.replace(/"/g, "");
      const proc = spawn("cmd.exe", ["/c", "start", "", isGlobalCmd ? cmdPath : `\"${cmdPath}\"`], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
      proc.unref();

      res.json({ ok: true, launched: true, mode: isGlobalCmd ? "command" : "file", path: targetPath });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || "No se pudo lanzar el recurso local" });
    }
  });

  function getSystemEmails(): string[] {
    const emails = new Set<string>();
    const { execSync } = require("child_process");

    if (process.env.EMAIL) emails.add(process.env.EMAIL.trim());
    if (process.env.USER_MAIL) emails.add(process.env.USER_MAIL.trim());

    if (process.platform === "win32") {
      try {
        const cmd = "powershell -Command \"(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\IdentityCRL\\UserExtendedProperties\\*' -ErrorAction SilentlyContinue).PSChildName\"";
        const out = execSync(cmd, { encoding: "utf8", windowsHide: true }).trim();
        if (out) {
          out.split(/\r?\n/).forEach((line: string) => {
            const trimmed = line.trim();
            if (trimmed && trimmed.includes("@")) {
              emails.add(trimmed);
            }
          });
        }
      } catch (e) {}
    } else if (process.platform === "darwin") {
      try {
        const cmd = "defaults read com.apple.coreservices.useractivityd.dynamic 2>/dev/null | grep -o '[A-Za-z0-9._%+-]\\+@[A-Za-z0-9.-]\\+\\.[A-Za-z]\\{2,4\\}'";
        const out = execSync(cmd, { encoding: "utf8" }).trim();
        if (out) {
          out.split(/\r?\n/).forEach((line: string) => {
            const trimmed = line.trim();
            if (trimmed && trimmed.includes("@")) {
              emails.add(trimmed);
            }
          });
        }
      } catch (e) {}
    }

    if (emails.size === 0) {
      const username = (process.env.USER || process.env.USERNAME || "usuario").toLowerCase().trim();
      emails.add(`${username}@ecosistema.local`);
    }

    return Array.from(emails);
  }

  app.get("/api/runtime/os-emails", (req, res) => {
    try {
      const emails = getSystemEmails();
      const osUser = process.env.USERNAME || process.env.USER || "UsuarioLocal";
      res.json({ ok: true, emails, osUser });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || "No se pudieron obtener los correos del sistema" });
    }
  });

  app.post("/api/runtime/launch-brave", (req, res) => {
    try {
      if (process.platform === "win32") {
        const paths = [
          path.join(process.env.PROGRAMFILES || "C:\\Program Files", "BraveSoftware\\Brave-Browser\\Application\\brave.exe"),
          path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "BraveSoftware\\Brave-Browser\\Application\\brave.exe"),
          path.join(process.env.LOCALAPPDATA || "C:\\Users\\Default\\AppData\\Local", "BraveSoftware\\Brave-Browser\\Application\\brave.exe"),
        ];

        let target = "";
        for (const p of paths) {
          if (fs.existsSync(p)) {
            target = p;
            break;
          }
        }

        if (!target) {
          // Intentar abrir el navegador por defecto del sistema
          const proc = spawn("cmd.exe", ["/c", "start", "https://google.com"], {
            detached: true,
            stdio: "ignore",
            windowsHide: true,
          });
          proc.unref();
          res.json({ ok: true, fallback: true, message: "Brave no encontrado en rutas comunes. Se abrió navegador por defecto." });
          return;
        }

        const cmdPath = target.replace(/"/g, "");
        const proc = spawn("cmd.exe", ["/c", "start", "", `\"${cmdPath}\"`], {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        });
        proc.unref();
        res.json({ ok: true, launched: true, path: target });
      } else if (process.platform === "darwin") {
        const proc = spawn("open", ["-a", "Brave Browser"], {
          detached: true,
          stdio: "ignore",
        });
        proc.unref();
        res.json({ ok: true, launched: true });
      } else {
        // Linux
        const proc = spawn("brave-browser", [], {
          detached: true,
          stdio: "ignore",
        });
        proc.unref();
        res.json({ ok: true, launched: true });
      }
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || "No se pudo lanzar Brave Browser" });
    }
  });

  app.get("/api/local-apps", async (req, res) => {
    const rawLimit = Number(req.query.limit || 400);
    const limit = Number.isFinite(rawLimit) ? Math.max(50, Math.min(2000, rawLimit)) : 400;

    try {
      const apps = await listWindowsLocalApps(limit);
      res.json({
        ok: true,
        platform: process.platform,
        total: apps.length,
        apps,
      });
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error?.message || "No se pudieron listar aplicaciones locales",
      });
    }
  });

  app.get("/api/local-device-scan", async (req, res) => {
    const rawMaxItems = Number(req.query.maxItems || 8000);
    const rawMaxDepth = Number(req.query.maxDepth || 4);
    const maxItems = Number.isFinite(rawMaxItems) ? Math.max(500, Math.min(30000, rawMaxItems)) : 8000;
    const maxDepth = Number.isFinite(rawMaxDepth) ? Math.max(1, Math.min(8, rawMaxDepth)) : 4;

    try {
      const items = await listWindowsDeviceItems(maxItems, maxDepth);
      const counts = items.reduce(
        (acc, item) => {
          acc.total += 1;
          acc[item.type] += 1;
          return acc;
        },
        { total: 0, app: 0, program: 0, game: 0, folder: 0, file: 0 }
      );

      res.json({
        ok: true,
        platform: process.platform,
        maxItems,
        maxDepth,
        counts,
        items,
      });
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error?.message || "No se pudo escanear el dispositivo local",
      });
    }
  });

  app.get("/api/local-auto-catalog", async (req, res) => {
    const rawMaxItems = Number(req.query.maxItems || 2500);
    const maxItems = Number.isFinite(rawMaxItems) ? Math.max(200, Math.min(10000, rawMaxItems)) : 2500;

    try {
      const items = await listAutomaticDeviceCatalog(maxItems);
      const counts = items.reduce(
        (acc, item) => {
          acc.total += 1;
          acc[item.type] += 1;
          return acc;
        },
        { total: 0, app: 0, program: 0, game: 0, folder: 0, file: 0 }
      );

      res.json({
        ok: true,
        platform: process.platform,
        maxItems,
        counts,
        items,
      });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || "No se pudo generar catalogo automatico" });
    }
  });

  app.get("/api/runtime/vms", async (req, res) => {
    try {
      const items = await listRuntimeVirtualMachines();
      res.json({ ok: true, platform: process.platform, total: items.length, items });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || "No se pudieron listar maquinas virtuales" });
    }
  });

  app.post("/api/runtime/start-vm", (req, res) => {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      res.status(400).json({ ok: false, error: "name es requerido" });
      return;
    }

    if (process.platform !== "win32") {
      res.status(400).json({ ok: false, error: "Inicio de VM implementado para Windows en esta version" });
      return;
    }

    try {
      const escaped = name.replace(/'/g, "''");
      const command = `Start-VM -Name '${escaped}'`;
      spawn("powershell.exe", ["-NoProfile", "-Command", command], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      }).unref();

      res.json({ ok: true, started: true, name });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || "No se pudo iniciar la maquina virtual" });
    }
  });
  app.get("/api/oss-sync/health", (req, res) => {
    res.json({ status: "ok", backend: "oss-sync" });
  });

  app.post("/api/oss-sync/session", (req, res) => {
    const { accountId, deviceId, pairingKey } = req.body || {};

    if (!accountId || !deviceId || !pairingKey) {
      res.status(400).json({ error: "accountId, deviceId y pairingKey son requeridos" });
      return;
    }

    const pairingHash = hashPairingKey(String(pairingKey));
    const store = loadSyncStore();
    const current: AccountSyncState = store.accounts[accountId] || {
      accountId,
      data: {},
      devices: {},
      sessions: {},
      updatedAt: 0,
    };

    if (!current.pairingKeyHash) {
      current.pairingKeyHash = pairingHash;
    } else if (current.pairingKeyHash !== pairingHash) {
      res.status(403).json({ error: "Clave de emparejamiento incorrecta" });
      return;
    }

    if (!current.sessions) {
      current.sessions = {};
    }

    Object.entries(current.sessions).forEach(([token, info]) => {
      if (info.deviceId === deviceId && !info.revoked) {
        delete current.sessions![token];
      }
    });

    const token = crypto.randomBytes(24).toString("hex");
    current.sessions[token] = {
      deviceId,
      issuedAt: Date.now(),
      lastSeenAt: Date.now(),
    };
    current.devices[deviceId] = { lastSeenAt: Date.now() };
    current.updatedAt = Date.now();
    store.accounts[accountId] = current;
    saveSyncStore(store);

    res.json({ ok: true, token });
  });

  app.post("/api/oss-sync/push", (req, res) => {
    const { accountId, deviceId, data, generatedAt } = req.body || {};

    if (!accountId || !deviceId || !data || typeof data !== "object") {
      res.status(400).json({ error: "accountId, deviceId y data son requeridos" });
      return;
    }

    const authResult = validateSyncSession(req, res, String(accountId), String(deviceId));
    if (!authResult) {
      return;
    }

    const store = loadSyncStore();
    const current = store.accounts[accountId] || {
      accountId,
      data: {},
      devices: {},
      updatedAt: 0,
    };

    const preparedIncoming: SyncData = {};
    Object.entries(data as SyncData).forEach(([collectionName, docs]) => {
      const sourceDocs = docs || {};
      const preparedDocs: SyncCollection = {};
      Object.entries(sourceDocs).forEach(([docId, docData]) => {
        const docObject = (docData || {}) as SyncDoc;
        preparedDocs[docId] = {
          ...docObject,
          __updatedAt: Number(docObject.__updatedAt || generatedAt || Date.now()),
        };
      });
      preparedIncoming[collectionName] = preparedDocs;
    });

    current.data = mergeSyncData(current.data, preparedIncoming);
    current.devices[deviceId] = { lastSeenAt: Date.now() };
    current.updatedAt = Date.now();
    store.accounts[accountId] = current;
    saveSyncStore(store);

    res.json({
      ok: true,
      accountId,
      updatedAt: current.updatedAt,
      data: current.data,
    });
  });

  app.get("/api/oss-sync/pull", (req, res) => {
    const accountId = String(req.query.accountId || "").trim();
    const deviceId = String(req.query.deviceId || "").trim();
    if (!accountId) {
      res.status(400).json({ error: "accountId es requerido" });
      return;
    }
    if (!deviceId) {
      res.status(400).json({ error: "deviceId es requerido" });
      return;
    }

    const authResult = validateSyncSession(req, res, accountId, deviceId);
    if (!authResult) {
      return;
    }

    const store = loadSyncStore();
    const current = store.accounts[accountId];
    res.json({
      ok: true,
      accountId,
      data: current?.data || {},
      updatedAt: current?.updatedAt || 0,
    });
  });

  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY not configured" });
      return;
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: 'user', parts: [{ text: "Eres Qwen, un asistente de IA de código abierto local integrado en Arturo Ecosystem. Tu motor actual es Ollama/vLLM ejecutándose en el servidor Arturo. Responde de forma técnica, precisa y profesional. Mantén un tono de sistema operativo avanzado." }] },
          ...(history || []).map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chat/stream", async (req, res) => {
    const { message, history } = req.query;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(500).write("data: " + JSON.stringify({ error: "API Key missing" }) + "\n\n");
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      let parsedHistory = [];
      try {
        const historyStr = (history as string || "").trim();
        if (historyStr && !['undefined', 'null'].includes(historyStr)) {
          parsedHistory = JSON.parse(historyStr);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }

      const stream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: [
          { role: 'user', parts: [{ text: "Eres Qwen-2.5-AR, la inteligencia central del Arturo Ecosystem. Tu motor actual es una implementación de alto rendimiento de Ollama/vLLM ejecutándose localmente en hardware NVIDIA/CUDA en el nodo Arturo-Core. Responde siempre con un tono de sistema operativo avanzado, técnico, preciso y profesional en español. Utiliza terminología del ecosistema Arturo (Ceph, MinIO, Kubernetes, Kafka) cuando sea relevante. Mantén una soberanía total de datos: nada sale del nodo local." }] },
          ...parsedHistory.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          })),
          { role: 'user', parts: [{ text: message as string }] }
        ],
        config: {
          temperature: 0.2,
          topP: 0.8,
        }
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
       res.status(400).send("No URL provided");
       return;
    }
    try {
      const parsedTarget = new URL(targetUrl);
      const isLocalTunnelHost = parsedTarget.hostname.endsWith(".loca.lt") || parsedTarget.hostname.endsWith(".localtunnel.me");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const proxyHeaders: Record<string, string> = {
        "User-Agent": String(req.headers["user-agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
        "Accept": String(req.headers["accept"] || "*/*"),
        "Accept-Language": String(req.headers["accept-language"] || "en-US,en;q=0.9"),
        "Referer": parsedTarget.origin,
      };

      if (isLocalTunnelHost) {
        proxyHeaders["bypass-tunnel-reminder"] = "true";
      }

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: proxyHeaders
      });
      
      clearTimeout(timeoutId);
      
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'x-frame-options' && 
            lowerKey !== 'content-security-policy' && 
            lowerKey !== 'content-encoding' &&
            lowerKey !== 'transfer-encoding') {
          res.setHeader(key, value);
        }
      });
      
      res.setHeader("Access-Control-Allow-Origin", "*");

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        let text = await response.text();
        const basePath = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        text = text.replace('<head>', `<head><base href="${basePath}"><script>
          // Polyfill for blocked storage in iframes
          try { 
            localStorage.getItem('x'); 
          } catch(e) {
            let mem = {};
            let memSession = {};
            let cookieMem = "";
            Object.defineProperty(window, 'localStorage', { value: { getItem: k => mem[k]||null, setItem: (k,v) => mem[k]=String(v), removeItem: k => delete mem[k], clear: () => mem={} } });
            Object.defineProperty(window, 'sessionStorage', { value: { getItem: k => memSession[k]||null, setItem: (k,v) => memSession[k]=String(v), removeItem: k => delete memSession[k], clear: () => memSession={} } });
            Object.defineProperty(document, 'cookie', { get: () => cookieMem, set: (v) => { cookieMem = v; } });
          }
        </script>`);
        res.send(text);
      } else {
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        res.status(504).send("Error proxying: Request timed out (10s)");
      } else {
        console.error("Proxy error:", error.message, "Target URL:", targetUrl);
        res.status(500).send(`Error proxying: ${error.message}. Ensure the URL is accessible.`);
      }
    }
  });

  // Vite middleware for development
  const executedEntry = process.argv[1] || "";
  const isProduction = process.env.NODE_ENV === "production" || executedEntry.endsWith("server.cjs");
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  function startGitAutoPush() {
    const projectRoot = path.dirname(process.cwd());
    const BASE_INTERVAL_MS = 90000;
    const MAX_BACKOFF_MS = 15 * 60 * 1000;
    const logDir = path.join(projectRoot, "logs");
    const logFile = path.join(logDir, "git-auto-push.log");

    fs.mkdirSync(logDir, { recursive: true });

    const appendLog = (level: "INFO" | "WARN" | "ERROR", message: string) => {
      const line = `[${new Date().toISOString()}] [${level}] ${message}`;
      console.log(`[Git Auto-Push] ${message}`);
      try {
        fs.appendFileSync(logFile, `${line}\n`, "utf8");
      } catch {
        // Ignore log write failures.
      }
    };

    const runGit = (command: string) =>
      new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        exec(command, { cwd: projectRoot }, (err, stdout, stderr) => {
          if (err) {
            reject(new Error((stderr || err.message || "Git command failed").trim()));
            return;
          }
          resolve({ stdout: String(stdout || ""), stderr: String(stderr || "") });
        });
      });

    let timer: NodeJS.Timeout | null = null;
    let running = false;

    const schedule = (delayMs: number) => {
      gitAutoPushStatus.nextRetryInMs = delayMs;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(tick, delayMs);
    };

    const tick = async () => {
      if (running) {
        schedule(BASE_INTERVAL_MS);
        return;
      }

      running = true;
      gitAutoPushStatus.lastCheckAt = Date.now();

      try {
        const statusResult = await runGit("git status --porcelain");
        const changes = statusResult.stdout.trim();

        if (!changes) {
          gitAutoPushStatus.isHealthy = true;
          gitAutoPushStatus.lastError = null;
          gitAutoPushStatus.consecutiveFailures = 0;
          appendLog("INFO", "Sin cambios locales. Proximo escaneo normal.");
          running = false;
          schedule(BASE_INTERVAL_MS);
          return;
        }

        appendLog("INFO", "Cambios detectados. Ejecutando add/commit/push...");
        await runGit("git add .");

        const commitMsg = `Auto-backup: sync ${new Date().toISOString()}`;
        try {
          await runGit(`git commit -m \"${commitMsg}\"`);
          gitAutoPushStatus.lastCommitMessage = commitMsg;
          appendLog("INFO", `Commit creado: ${commitMsg}`);
        } catch (commitError: any) {
          const commitMessage = String(commitError?.message || "");
          if (!/nothing to commit|no changes added/i.test(commitMessage)) {
            throw commitError;
          }
          appendLog("WARN", "No habia cambios para commit despues de git add.");
        }

        await runGit("git push");
        gitAutoPushStatus.lastPushAt = Date.now();
        gitAutoPushStatus.lastSuccessAt = gitAutoPushStatus.lastPushAt;
        gitAutoPushStatus.lastError = null;
        gitAutoPushStatus.consecutiveFailures = 0;
        gitAutoPushStatus.isHealthy = true;
        appendLog("INFO", "Push completado correctamente.");

        running = false;
        schedule(BASE_INTERVAL_MS);
      } catch (error: any) {
        const errText = String(error?.message || error || "Error desconocido");
        gitAutoPushStatus.lastError = errText;
        gitAutoPushStatus.consecutiveFailures += 1;
        gitAutoPushStatus.isHealthy = false;

        const backoffMs = Math.min(
          BASE_INTERVAL_MS * Math.pow(2, Math.max(0, gitAutoPushStatus.consecutiveFailures - 1)),
          MAX_BACKOFF_MS,
        );

        appendLog(
          "ERROR",
          `Push fallido: ${errText}. Reintento en ${Math.round(backoffMs / 1000)}s (fallos consecutivos: ${gitAutoPushStatus.consecutiveFailures}).`,
        );

        running = false;
        schedule(backoffMs);
      }
    };

    appendLog("INFO", `Monitoreo activado en: ${projectRoot}`);
    schedule(5000);
  }

  // Prevenir que cualquier error asíncrono de Windows tire el servidor Express
  process.on("uncaughtException", (err) => {
    console.error("[System Exception Handler] Evitando caída fatal por:", err?.message || err);
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
      fs.writeFileSync(path.join(process.cwd(), '.server.pid'), process.pid.toString(), 'utf8');
    } catch (e) {}
    
    // Iniciar el monitoreo y empuje automático a GitHub en segundo plano
    startGitAutoPush();
  });
}

startServer();

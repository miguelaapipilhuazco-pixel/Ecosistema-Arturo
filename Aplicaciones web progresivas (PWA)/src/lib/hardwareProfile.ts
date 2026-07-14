export type HardwareTier = 'low' | 'medium' | 'high';
export type TextureQuality = 'low' | 'medium' | 'high';
export type RendererCategory = 'integrated' | 'dedicated' | 'software' | 'unknown';

export interface HardwareProfile {
  tier: HardwareTier;
  score: number;
  deviceMemoryGB: number | null;
  renderer: string | null;
  rendererCategory: RendererCategory;
  features: {
    shadows: boolean;
    textures: TextureQuality;
    lod: boolean;
    lazyLoading: boolean;
    cloudRenderingRecommended: boolean;
  };
}

const STORAGE_KEY = 'ecosystem_hardware_profile';

const DEFAULT_PROFILE: HardwareProfile = {
  tier: 'medium',
  score: 50,
  deviceMemoryGB: null,
  renderer: null,
  rendererCategory: 'unknown',
  features: {
    shadows: true,
    textures: 'medium',
    lod: true,
    lazyLoading: true,
    cloudRenderingRecommended: false,
  },
};

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in private/restricted contexts.
  }
}

function detectRenderer(): { renderer: string | null; rendererCategory: RendererCategory } {
  if (typeof document === 'undefined') {
    return { renderer: null, rendererCategory: 'unknown' };
  }

  const canvas = document.createElement('canvas');
  const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
  if (!gl) {
    return { renderer: null, rendererCategory: 'unknown' };
  }

  try {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as any;
    const renderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    const normalized = renderer.trim() || null;

    if (!normalized) {
      return { renderer: null, rendererCategory: 'unknown' };
    }

    const lower = normalized.toLowerCase();
    if (/swiftshader|llvmpipe|software|mesa/i.test(lower)) {
      return { renderer: normalized, rendererCategory: 'software' };
    }
    if (/intel|uhd|iris|hd graphics|mali|adreno|apple gpu|apple m/i.test(lower)) {
      return { renderer: normalized, rendererCategory: 'integrated' };
    }
    if (/nvidia|geforce|rtx|gtx|quadro|radeon|rx |amd/i.test(lower)) {
      return { renderer: normalized, rendererCategory: 'dedicated' };
    }

    return { renderer: normalized, rendererCategory: 'unknown' };
  } catch {
    return { renderer: null, rendererCategory: 'unknown' };
  }
}

export function detectHardwareProfile(): HardwareProfile {
  const memoryGB = typeof navigator !== 'undefined' && typeof (navigator as any).deviceMemory === 'number'
    ? Number((navigator as any).deviceMemory)
    : null;

  const { renderer, rendererCategory } = detectRenderer();

  let score = 50;
  if (memoryGB !== null) {
    if (memoryGB <= 2) score -= 25;
    else if (memoryGB <= 4) score -= 10;
    else if (memoryGB >= 8) score += 15;
  } else {
    score -= 5;
  }

  if (rendererCategory === 'software') score -= 35;
  if (rendererCategory === 'integrated') score -= 12;
  if (rendererCategory === 'dedicated') score += 20;

  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    if (navigator.hardwareConcurrency <= 4) score -= 10;
    else if (navigator.hardwareConcurrency >= 8) score += 10;
  }

  score = Math.max(0, Math.min(100, score));

  const tier: HardwareTier = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    tier,
    score,
    deviceMemoryGB: memoryGB,
    renderer,
    rendererCategory,
    features: {
      shadows: tier !== 'low',
      textures: tier === 'high' ? 'high' : tier === 'medium' ? 'medium' : 'low',
      lod: true,
      lazyLoading: true,
      cloudRenderingRecommended: tier === 'low',
    },
  };
}

export function applyHardwareProfile(profile: HardwareProfile) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.performance = profile.tier;
    document.documentElement.dataset.textureQuality = profile.features.textures;
    document.documentElement.dataset.gpuClass = profile.rendererCategory;
  }

  safeStorageSet(STORAGE_KEY, JSON.stringify(profile));
}

export function getHardwareProfile(): HardwareProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_PROFILE;
  }

  const stored = safeStorageGet(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as HardwareProfile;
      if (parsed && typeof parsed === 'object' && parsed.tier && parsed.features) {
        return parsed;
      }
    } catch {
      // Fall through to fresh detection.
    }
  }

  const profile = detectHardwareProfile();
  applyHardwareProfile(profile);
  return profile;
}

export function bootstrapHardwareProfile() {
  const profile = detectHardwareProfile();
  applyHardwareProfile(profile);
  return profile;
}

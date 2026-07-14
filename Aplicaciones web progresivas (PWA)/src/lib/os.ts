export type OS = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown';

export function getOS(): OS {
  const userAgent = window.navigator.userAgent;
  const platform = (window.navigator as any).platform || '';
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'macos';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return 'ios';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'windows';
  } else if (/Android/.test(userAgent)) {
    return 'android';
  } else if (!platform && /Linux/.test(userAgent)) {
    return 'linux';
  }

  return 'unknown';
}

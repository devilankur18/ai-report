import fs from 'fs';
import path from 'path';

export interface ImageSetEntry {
  file: string;
  role: 'hook' | 'scene' | 'cta' | 'portrait';
  alt?: string;
}

export interface DoctorProfile {
  name: string;
  specialty: string;
  domain: string;
  avatar?: string;
  logo?: string;
  /** Legacy: flat list of images for slideshow cycling */
  images?: string[];
  /** Phase 1+: role-tagged images for intelligent scene assignment */
  imageSet?: ImageSetEntry[];
  /** Documents minimum photo requirements (informational) */
  minPhotoRequirements?: {
    portrait?: number;
    clinic?: number;
    consultation?: number;
  };
}

export interface DesignConfig {
  template: string;
  defaultLanguage: string;
  ctaText?: string;
  ctaType?: 'follow' | 'subscribe' | 'appointment' | 'listen';
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaLink?: string;
  ctaHandle?: string;
  bgVideoUrl?: string;
  /** Lock a specific hook animation style for this design */
  hookStyle?: 'zoom-face' | 'stat-counter' | 'text-slam' | 'typewriter-bold' | 'split-reveal' | 'word-cascade';
  /** Explicit font pairing override (0-4). If omitted, personalization engine picks. */
  fontPairingIndex?: number;
  /** Explicit decoration style override. If omitted, personalization engine picks. */
  decorationStyle?: 'accent-bar' | 'accent-line' | 'quote-marks' | 'numbered';
  /** Explicit image treatment override. If omitted, personalization engine picks. */
  imageTreatment?: 'full-color' | 'duotone-warm' | 'duotone-cool';
  /** Explicit layout variant override. If omitted, personalization engine picks. */
  layoutVariant?: string;
  theme: {
    accentColor: string;
    textColor?: string;
    textSecondaryColor?: string;
    bgType: 'gradient' | 'solid' | 'video' | 'particles' | 'image' | 'hero-portrait';
    bgGradientStart?: string;
    bgGradientEnd?: string;
    bgSolid?: string;
    overlayStyle?: 'scrim-bottom' | 'scrim-full' | 'vignette' | 'none';
  };
}

export interface ResolvedProps {
  expertName: string;
  expertSpecialty: string;
  domain: string;
  template: string;
  language: string;
  ctaText: string;
  ctaType?: 'follow' | 'subscribe' | 'appointment' | 'listen';
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaLink?: string;
  ctaHandle?: string;
  accentColor: string;
  textColor: string;
  textSecondaryColor: string;
  bgGradientStart?: string;
  bgGradientEnd?: string;
  bgSolid?: string;
  bgVideoUrl?: string;
  bgType: 'gradient' | 'solid' | 'video' | 'particles' | 'image' | 'hero-portrait';
  overlayStyle?: 'scrim-bottom' | 'scrim-full' | 'vignette' | 'none';
  expertAvatar?: string;
  expertLogo?: string;
  /** Legacy flat image array (used by AnimatedBackground slideshow) */
  expertImages?: string[];
  /** Role-tagged image set for intelligent hook/scene/cta assignment */
  expertImageSet?: Array<{ file: string; role: string; alt?: string }>;
  /** Design-level hook style lock */
  hookStyle?: string;
  /** Font pairing index (0-4 for English, 0-1 for Hindi). Personalization engine fills this. */
  fontPairingIndex?: number;
  /** Decoration style for quote card embellishment */
  decorationStyle?: string;
  /** CSS filter treatment for doctor photos */
  imageTreatment?: string;
  /** Layout variant for quote positioning */
  layoutVariant?: string;
  /** Client ID for personalization hashing */
  clientId?: string;
  /** Design ID for personalization hashing */
  designId?: string;
  themeId?: string;
}

export function resolveClientConfig(
  projectRoot: string,
  clientId: string,
  designId: string
): ResolvedProps {
  const clientDir = path.join(projectRoot, 'clients', clientId);
  const profilePath = path.join(clientDir, 'profile.json');
  const designPath = path.join(clientDir, 'designs', `${designId}.json`);

  // 1. Verify existence
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Client profile not found at ${profilePath}`);
  }
  if (!fs.existsSync(designPath)) {
    throw new Error(`Client design config not found at ${designPath}`);
  }

  // 2. Read configurations
  const profile: DoctorProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  const design: DesignConfig = JSON.parse(fs.readFileSync(designPath, 'utf8'));

  // 3. Sync Assets (clients/<id>/assets/ → public/clients/<id>/)
  const publicClientDir = path.join(projectRoot, 'public', 'clients', clientId);
  fs.mkdirSync(publicClientDir, { recursive: true });

  const ts = Date.now();
  let resolvedAvatar: string | undefined = undefined;
  let resolvedLogo: string | undefined = undefined;
  const resolvedImages: string[] = [];
  const resolvedImageSet: Array<{ file: string; role: string; alt?: string }> = [];

  // ── Copy role-tagged imageSet (Phase 1+) ─────────────────────────────
  if (profile.imageSet && Array.isArray(profile.imageSet)) {
    profile.imageSet.forEach((entry, index) => {
      const srcPath = path.join(clientDir, 'assets', entry.file);
      if (fs.existsSync(srcPath)) {
        const destFilename = `${ts}-set${index}-${entry.file}`;
        const destPath = path.join(publicClientDir, destFilename);
        fs.copyFileSync(srcPath, destPath);
        const resolvedFile = `clients/${clientId}/${destFilename}`;
        resolvedImageSet.push({ file: resolvedFile, role: entry.role, alt: entry.alt });
        // Also add to flat images list for backward compat
        resolvedImages.push(resolvedFile);
      } else {
        console.warn(`[resolver] Warning: imageSet file not found at ${srcPath}`);
      }
    });
    console.log(`[resolver] Synced ${resolvedImageSet.length} role-tagged images.`);
  } else if (profile.images && Array.isArray(profile.images)) {
    // ── Legacy flat images array ─────────────────────────────────────────
    profile.images.forEach((imgName, index) => {
      const srcImgPath = path.join(clientDir, 'assets', imgName);
      if (fs.existsSync(srcImgPath)) {
        const destFilename = `${ts}-${index}-${imgName}`;
        const destImgPath = path.join(publicClientDir, destFilename);
        fs.copyFileSync(srcImgPath, destImgPath);
        resolvedImages.push(`clients/${clientId}/${destFilename}`);
      } else {
        console.warn(`[resolver] Warning: Image file not found at ${srcImgPath}`);
      }
    });
    console.log(`[resolver] Synced ${resolvedImages.length} images for slideshow.`);
  }

  // ── Copy single avatar ────────────────────────────────────────────────
  if (profile.avatar) {
    const srcAvatarPath = path.join(clientDir, 'assets', profile.avatar);
    if (fs.existsSync(srcAvatarPath)) {
      const destFilename = `${ts}-avatar-${profile.avatar}`;
      const destAvatarPath = path.join(publicClientDir, destFilename);
      fs.copyFileSync(srcAvatarPath, destAvatarPath);
      resolvedAvatar = `clients/${clientId}/${destFilename}`;
      console.log(`[resolver] Synced avatar: ${resolvedAvatar}`);
    }
  }

  // ── Copy logo ─────────────────────────────────────────────────────────
  if (profile.logo) {
    const srcLogoPath = path.join(clientDir, 'assets', profile.logo);
    if (fs.existsSync(srcLogoPath)) {
      const destFilename = `${ts}-logo-${profile.logo}`;
      const destLogoPath = path.join(publicClientDir, destFilename);
      fs.copyFileSync(srcLogoPath, destLogoPath);
      resolvedLogo = `clients/${clientId}/${destFilename}`;
      console.log(`[resolver] Synced logo: ${resolvedLogo}`);
    }
  }

  // 4. Build resolved props
  return {
    expertName: profile.name,
    expertSpecialty: profile.specialty,
    domain: profile.domain,
    template: design.template,
    language: design.defaultLanguage,
    ctaText: design.ctaText || `Follow for more ${profile.domain} answers!`,
    ctaType: design.ctaType || 'follow',
    ctaTitle: design.ctaTitle,
    ctaSubtitle: design.ctaSubtitle,
    ctaLink: design.ctaLink,
    ctaHandle: design.ctaHandle,
    accentColor: design.theme.accentColor,
    textColor: design.theme.textColor || '#FFFFFF',
    textSecondaryColor: design.theme.textSecondaryColor || 'rgba(255,255,255,0.75)',
    bgType: design.theme.bgType,
    bgGradientStart: design.theme.bgGradientStart,
    bgGradientEnd: design.theme.bgGradientEnd,
    bgSolid: design.theme.bgSolid,
    bgVideoUrl: design.bgVideoUrl || undefined,
    overlayStyle: design.theme.overlayStyle,
    expertAvatar: resolvedAvatar,
    expertLogo: resolvedLogo,
    expertImages: resolvedImages.length > 0 ? resolvedImages : undefined,
    expertImageSet: resolvedImageSet.length > 0 ? resolvedImageSet : undefined,
    hookStyle: design.hookStyle,
    // Phase 3: Personalization fields (design config overrides; engine fills missing ones)
    fontPairingIndex: design.fontPairingIndex,
    decorationStyle: design.decorationStyle,
    imageTreatment: design.imageTreatment,
    layoutVariant: design.layoutVariant,
    clientId,
    designId,
  };
}

export interface VoiceConfig {
  engine: string;
  profile_id?: string;
  profile_name?: string;
  model?: string;
  type?: 'preset' | 'cloned';
  presetName?: string;
  instruct?: string;
  refAudio?: string;
  refText?: string;
  speed?: number;
  pitch?: number;
  refAudioAbsolutePath?: string;
}

export function resolveVoiceConfig(
  projectRoot: string,
  clientId: string,
  voiceId: string
): VoiceConfig {
  const clientDir = path.join(projectRoot, 'clients', clientId);
  let voicePath = path.join(clientDir, 'voices', `${voiceId}.json`);

  if (!fs.existsSync(voicePath)) {
    let found = false;
    for (const suffix of ['-en', '-hi']) {
      const altPath = path.join(clientDir, 'voices', `${voiceId}${suffix}.json`);
      if (fs.existsSync(altPath)) {
        voicePath = altPath;
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error(`Voice profile not found at ${voicePath}`);
    }
  }

  const voice: VoiceConfig = JSON.parse(fs.readFileSync(voicePath, 'utf8'));

  if (voice.type === 'cloned' && voice.refAudio) {
    voice.refAudioAbsolutePath = path.resolve(clientDir, 'assets', voice.refAudio);
  }

  return voice;
}


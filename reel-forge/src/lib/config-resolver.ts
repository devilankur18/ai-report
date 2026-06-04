import fs from 'fs';
import path from 'path';

export interface DoctorProfile {
  name: string;
  specialty: string;
  domain: string;
  avatar?: string;
  logo?: string;
  images?: string[];
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
  theme: {
    accentColor: string;
    textColor: string;
    textSecondaryColor: string;
    bgType: 'gradient' | 'solid' | 'video' | 'particles' | 'image';
    bgGradientStart?: string;
    bgGradientEnd?: string;
    bgSolid?: string;
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
  bgType: 'gradient' | 'solid' | 'video' | 'particles' | 'image';
  expertAvatar?: string;
  expertLogo?: string;
  expertImages?: string[];
}

export function resolveClientConfig(
  projectRoot: string,
  clientId: string,
  designId: string
): ResolvedProps {
  const clientDir = path.join(projectRoot, 'clients', clientId);
  const profilePath = path.join(clientDir, 'profile.json');
  const designPath = path.join(clientDir, 'designs', `${designId}.json`);

  // 1. Verify existence of directories
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Client profile not found at ${profilePath}`);
  }
  if (!fs.existsSync(designPath)) {
    throw new Error(`Client design config not found at ${designPath}`);
  }

  // 2. Read configurations
  const profile: DoctorProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  const design: DesignConfig = JSON.parse(fs.readFileSync(designPath, 'utf8'));

  // 3. Resolve Assets (Sync from clients/<client-id>/assets/ to public/clients/<client-id>/)
  const publicClientDir = path.join(projectRoot, 'public', 'clients', clientId);
  fs.mkdirSync(publicClientDir, { recursive: true });

  let resolvedAvatar: string | undefined = undefined;
  let resolvedLogo: string | undefined = undefined;
  const resolvedImages: string[] = [];

  // Copy images array if available
  if (profile.images && Array.isArray(profile.images)) {
    // Generate a unified timestamp for consistency within a render
    const ts = Date.now();
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

  // Copy single avatar (default fallback profile picture)
  if (profile.avatar) {
    const srcAvatarPath = path.join(clientDir, 'assets', profile.avatar);
    if (fs.existsSync(srcAvatarPath)) {
      const destFilename = `${Date.now()}-avatar-${profile.avatar}`;
      const destAvatarPath = path.join(publicClientDir, destFilename);
      fs.copyFileSync(srcAvatarPath, destAvatarPath);
      resolvedAvatar = `clients/${clientId}/${destFilename}`;
      console.log(`[resolver] Synced avatar asset: ${resolvedAvatar}`);
    } else {
      console.warn(`[resolver] Warning: Avatar file not found at ${srcAvatarPath}`);
    }
  }

  // Copy logo watermark
  if (profile.logo) {
    const srcLogoPath = path.join(clientDir, 'assets', profile.logo);
    if (fs.existsSync(srcLogoPath)) {
      const destFilename = `${Date.now()}-logo-${profile.logo}`;
      const destLogoPath = path.join(publicClientDir, destFilename);
      fs.copyFileSync(srcLogoPath, destLogoPath);
      resolvedLogo = `clients/${clientId}/${destFilename}`;
      console.log(`[resolver] Synced logo asset: ${resolvedLogo}`);
    } else {
      console.warn(`[resolver] Warning: Logo file not found at ${srcLogoPath}`);
    }
  }

  // 4. Merge values together into standard Remotion props
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
    textColor: design.theme.textColor,
    textSecondaryColor: design.theme.textSecondaryColor,
    bgType: design.theme.bgType,
    bgGradientStart: design.theme.bgGradientStart,
    bgGradientEnd: design.theme.bgGradientEnd,
    bgSolid: design.theme.bgSolid,
    bgVideoUrl: design.bgVideoUrl || undefined,
    expertAvatar: resolvedAvatar,
    expertLogo: resolvedLogo,
    expertImages: resolvedImages.length > 0 ? resolvedImages : undefined,
  };
}

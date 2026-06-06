import fs from 'fs';
import path from 'path';
export function resolveClientConfig(projectRoot, clientId, designId) {
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
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    const design = JSON.parse(fs.readFileSync(designPath, 'utf8'));
    // 3. Sync Assets (clients/<id>/assets/ → public/clients/<id>/)
    const publicClientDir = path.join(projectRoot, 'public', 'clients', clientId);
    fs.mkdirSync(publicClientDir, { recursive: true });
    const ts = Date.now();
    let resolvedAvatar = undefined;
    let resolvedLogo = undefined;
    const resolvedImages = [];
    const resolvedImageSet = [];
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
            }
            else {
                console.warn(`[resolver] Warning: imageSet file not found at ${srcPath}`);
            }
        });
        console.log(`[resolver] Synced ${resolvedImageSet.length} role-tagged images.`);
    }
    else if (profile.images && Array.isArray(profile.images)) {
        // ── Legacy flat images array ─────────────────────────────────────────
        profile.images.forEach((imgName, index) => {
            const srcImgPath = path.join(clientDir, 'assets', imgName);
            if (fs.existsSync(srcImgPath)) {
                const destFilename = `${ts}-${index}-${imgName}`;
                const destImgPath = path.join(publicClientDir, destFilename);
                fs.copyFileSync(srcImgPath, destImgPath);
                resolvedImages.push(`clients/${clientId}/${destFilename}`);
            }
            else {
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
export function resolveVoiceConfig(projectRoot, clientId, voiceId) {
    const clientDir = path.join(projectRoot, 'clients', clientId);
    const voicePath = path.join(clientDir, 'voices', `${voiceId}.json`);
    if (!fs.existsSync(voicePath)) {
        throw new Error(`Voice profile not found at ${voicePath}`);
    }
    const voice = JSON.parse(fs.readFileSync(voicePath, 'utf8'));
    if (voice.type === 'cloned' && voice.refAudio) {
        voice.refAudioAbsolutePath = path.resolve(clientDir, 'assets', voice.refAudio);
    }
    return voice;
}

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveClientConfig } from '../src/lib/config-resolver';

// Parse arguments manually to avoid extra dependencies
function parseArgs() {
  const args: Record<string, string | boolean> = {};
  const argv = process.argv.slice(2);
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      // Check if next item is a value or another flag
      const nextVal = argv[i + 1];
      if (nextVal && !nextVal.startsWith('--')) {
        args[key] = nextVal;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to create a URL/filename safe slug from text (falls back to audio filename if non-ASCII or empty)
function getSlug(text: string, fallbackAudioPath: string): string {
  const clean = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  if (clean.length > 2) {
    return clean.slice(0, 30); // limit slug length
  }
  
  // Fallback to audio filename base
  const audioBase = path.basename(fallbackAudioPath, path.extname(fallbackAudioPath));
  return audioBase
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 30);
}

function getFormattedTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function main() {
  const args = parseArgs();

  // Show help if requested or missing required arguments
  if (args.help || (!args.audio && !args.props)) {
    console.log(`
ReelForge Scalable Video Render Orchestrator
-------------------------------------------
Usage:
  npx tsx cli/render.ts \\
    --audio ./samples/expert-advice.mp3 \\
    --client dr-priya-sharma \\
    --design classic-reels

Options:
  --client <id>           Directory name of the client under clients/
  --design <id>           Name of the design profile JSON (default: classic-reels)
  --audio <path>          Path to the local expert audio file (.mp3 / .wav)
  
Alternative Manual overrides (skips client profile):
  --expert <name>         Name of the expert
  --specialty <title>     Title/specialty of the expert
  --domain <name>         Domain/niche (e.g. Skincare)
  --template <name>       Template: "hook-quote" or "minimal-podcast" (default: hook-quote)
  --theme <theme-id>      Branding theme ID

Rendering Options:
  --out <path>            Override output path for the rendered MP4
  --lang <lang-code>      Override presentation language (e.g. en, hi)
  --asr-lang <lang-code>  Force ASR transcription language (default: auto-detect)
  --bg-video <path>       Custom background loop video file relative to public/
  --model <model>         Ollama model (default: gemma4:e4b)
  --whisper-model <size>  Whisper model size (default: small)
  --accent-color <hex>    Accent color override (e.g. #FF6B35)
  --skip-ai               Skip transcription/LLM (uses existing tmp/props.json)
  --props <path>          Path to a pre-generated props.json (skips AI entirely)
  --preview               Open Remotion Studio instead of rendering
    `);
    process.exit(0);
  }

  const audio = args.audio as string;
  if (audio && !fs.existsSync(audio)) {
    console.error(`[render] Error: Audio file not found at ${audio}`);
    process.exit(1);
  }

  // 1. Resolve Profile and Design Config
  let clientNameId = args.client as string;
  let designId = (args.design as string) || 'classic-reels';

  let expert = args.expert as string;
  let specialty = args.specialty as string;
  let domain = args.domain as string;
  let template = (args.template as string) || 'hook-quote';
  let targetLang = (args.lang as string) || 'en';
  let accentColor = args['accent-color'] as string;
  let bgVideo = (args['bg-video'] as string) || '';
  
  // Custom theme variables (used for manual overrides)
  let themeId = args.theme as string;

  let expertAvatar: string | undefined = undefined;
  let expertLogo: string | undefined = undefined;

  let clientProps: any = {};

  if (clientNameId) {
    console.log(`[render] Loading client profile for: ${clientNameId} (Design: ${designId})`);
    try {
      clientProps = resolveClientConfig(projectRoot, clientNameId, designId);
      
      // Map configuration variables
      expert = clientProps.expertName;
      specialty = clientProps.expertSpecialty;
      domain = clientProps.domain;
      template = clientProps.template;
      targetLang = args.lang as string || clientProps.language; // CLI override takes priority
      accentColor = args['accent-color'] as string || clientProps.accentColor;
      bgVideo = args['bg-video'] as string || clientProps.bgVideoUrl || '';
      expertAvatar = clientProps.expertAvatar;
      expertLogo = clientProps.expertLogo;
      themeId = clientProps.themeId; // Resolved from design config
    } catch (err: any) {
      console.error(`[render] Error: Failed to resolve client config.`, err.message);
      process.exit(1);
    }
  } else {
    // Manual fallback mode (must have expert, specialty, domain)
    if (!args.props && !args['skip-ai']) {
      if (!audio || !expert || !specialty || !domain) {
        console.error('[render] Error: --client OR manual overrides (--expert, --specialty, --domain) are required.');
        process.exit(1);
      }
    }
  }

  const model = (args.model as string) || 'gemma4:e4b';
  const whisperModel = (args.whisper_model as string) || 'small';
  const preview = !!args.preview;
  
  let propsPath = (args.props as string) || path.join(projectRoot, 'tmp', 'props.json');

  // Step 1: Run AI pipeline if not using custom props
  if (!args.props && !args['skip-ai']) {
    console.log('[render] Running AI pipeline (Transcription + Metadata)...');
    
    let pipelineCmd = `uv run --with faster-whisper --with requests python3 "${path.join(projectRoot, 'cli', 'pipeline.py')}" \
      --audio "${audio}" \
      --expert "${expert}" \
      --specialty "${specialty}" \
      --domain "${domain}" \
      --template "${template}" \
      --model "${model}" \
      --whisper-model "${whisperModel}" \
      --language "${targetLang}"`;

    if (args['asr-lang']) {
      pipelineCmd += ` --asr-language "${args['asr-lang']}"`;
    }

    pipelineCmd += ` --output "${propsPath}"`;

    try {
      execSync(pipelineCmd, { stdio: 'inherit', cwd: projectRoot });
    } catch (err) {
      console.error('[render] Error: AI pipeline execution failed.', err);
      process.exit(1);
    }
  }

  // Step 2: Read generated/provided props JSON
  if (!fs.existsSync(propsPath)) {
    console.error(`[render] Error: Props JSON file not found at ${propsPath}`);
    process.exit(1);
  }

  const props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));

  // Step 3: Copy audio file to public/audio/ and rewrite props audioUrl
  let audioSrcFile = props.audioUrl;
  if (audio) {
    audioSrcFile = audio;
  }

  if (audioSrcFile && fs.existsSync(audioSrcFile)) {
    const publicAudioDir = path.join(projectRoot, 'public', 'audio');
    if (!fs.existsSync(publicAudioDir)) {
      fs.mkdirSync(publicAudioDir, { recursive: true });
    }
    
    const audioDestFilename = path.basename(audioSrcFile);
    const audioDestPath = path.join(publicAudioDir, audioDestFilename);
    
    console.log(`[render] Copying audio asset to public: ${audioDestPath}`);
    fs.copyFileSync(audioSrcFile, audioDestPath);
    
    props.audioUrl = `audio/${audioDestFilename}`;
  } else {
    console.warn(`[render] Warning: Audio file source '${audioSrcFile}' was not found or is empty.`);
  }

  // Apply resolved config properties / manual overrides
  if (clientNameId) {
    // Merge all client resolved properties (theme text colors, backgrounds, etc)
    Object.assign(props, clientProps);
  } else {
    // Manual overrides
    props.language = targetLang;
    if (themeId) props.themeId = themeId;
    if (bgVideo) props.bgVideoUrl = bgVideo;
    if (accentColor) props.accentColor = accentColor;
  }

  // CLI Accent Color Override (highest priority)
  if (args['accent-color']) {
    props.accentColor = args['accent-color'] as string;
  }

  // Save the updated props back to temp path
  const updatedPropsPath = path.join(projectRoot, 'tmp', 'props-resolved.json');
  fs.mkdirSync(path.dirname(updatedPropsPath), { recursive: true });
  fs.writeFileSync(updatedPropsPath, JSON.stringify(props, null, 2));

  // Step 4: Determine client-aware Output Path
  let finalOutPath = args.out as string;
  
  if (!finalOutPath) {
    const safeClientId = clientNameId || 'manual';
    const timestamp = getFormattedTimestamp();
    const cleanDesignId = clientNameId ? designId : (themeId || 'default');
    const slugSource = props.title || props.domain || 'video';
    const topicSlug = getSlug(slugSource, audioSrcFile || 'video.mp3');
    
    finalOutPath = path.join(projectRoot, 'out', safeClientId, `${timestamp}-${template}-${cleanDesignId}-${topicSlug}.mp4`);
  } else {
    finalOutPath = path.resolve(projectRoot, finalOutPath);
  }

  // Step 5: Render or Preview via Remotion CLI
  const rootPath = path.join(projectRoot, 'src', 'index.tsx');
  
  if (preview) {
    console.log('[render] Launching Remotion Studio preview...');
    const previewCmd = `npx remotion preview "${rootPath}" --props="${updatedPropsPath}"`;
    try {
      execSync(previewCmd, { stdio: 'inherit', cwd: projectRoot });
    } catch (err) {
      console.error('[render] Remotion preview server exited.', err);
    }
  } else {
    // Ensure output directory exists
    fs.mkdirSync(path.dirname(finalOutPath), { recursive: true });
    
    console.log(`[render] Rendering video composition '${template}' to: ${finalOutPath}...`);
    const renderCmd = `npx remotion render "${rootPath}" "${template}" "${finalOutPath}" --props="${updatedPropsPath}" --codec=h264`;
    
    try {
      execSync(renderCmd, { stdio: 'inherit', cwd: projectRoot });
      console.log(`\n[render] ✅ Render successful! Output file: ${finalOutPath}`);
    } catch (err) {
      console.error('[render] Error: Remotion render failed.', err);
      process.exit(1);
    }
  }
}

main();

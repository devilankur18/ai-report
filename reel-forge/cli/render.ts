import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveClientConfig, resolveVoiceConfig } from '../src/lib/config-resolver';

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
  if (args.help || (!args.audio && !args.props && !args.question)) {
    console.log(`
ReelForge Scalable Video Render Orchestrator
-------------------------------------------
Usage:
  npx tsx cli/render.ts \
    --audio ./samples/expert-advice.mp3 \
    --client dr-priya-sharma \
    --design classic-reels

Options:
  --client <id>           Directory name of the client under clients/
  --design <id>           Name of the design profile JSON (default: classic-reels)
  --audio <path>          Path to the local expert audio file (.mp3 / .wav)
  --voice <voice-id>      Voice profile ID under clients/<client-id>/voices/
  --question "<text>"     Text question to generate answer and voice dynamically
  --duration <seconds>    Target answer duration in seconds (default: 30)
  
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
  --hook-style <style>    Override the hook style (e.g. 3d-stack, glitch-cycle)
  --skip-ai               Skip transcription/LLM (uses existing tmp/props.json)
  --props <path>          Path to a pre-generated props.json (skips AI entirely)
  --preview               Open Remotion Studio instead of rendering
    `);
    process.exit(0);
  }

  let audio = args.audio as string;
  const question = args.question as string;
  let voiceId = args.voice as string;
  const duration = args.duration ? parseInt(args.duration as string, 10) : 30;
  const questionSlug = question ? getSlug(question, 'question') : '';

  // 1. Resolve Profile and Design Config
  let clientNameId = args.client as string;
  let designId = (args.design as string) || 'talking-head-qna';

  let expert = args.expert as string;
  let specialty = args.specialty as string;
  let domain = args.domain as string;
  let template = (args.template as string) || 'talking-head-qna';
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
      if (!audio && !question && (!expert || !specialty || !domain)) {
        console.error('[render] Error: --client OR manual overrides (--expert, --specialty, --domain) are required.');
        process.exit(1);
      }
    }
  }

  // 1b. If question is specified, run the Text-to-Speech generation pipeline
  if (question) {
    if (!clientNameId) {
      console.error('[render] Error: --client is required when using --question.');
      process.exit(1);
    }
    
    // Resolve voice config based on language and defaults
    if (!voiceId) {
      const voicesDir = path.join(projectRoot, 'clients', clientNameId, 'voices');
      if (fs.existsSync(voicesDir)) {
        const files = fs.readdirSync(voicesDir).filter(f => f.endsWith('.json'));
        
        if (targetLang === 'hi') {
          // Look for Hindi specific profiles
          if (files.includes('default-hi.json')) {
            voiceId = 'default-hi';
          } else {
            const hiFile = files.find(f => f.endsWith('-hi.json'));
            if (hiFile) {
              voiceId = path.basename(hiFile, '.json');
            } else if (files.includes('default-en.json')) {
              voiceId = 'default-en';
            } else if (files.includes('default.json')) {
              voiceId = 'default';
            } else if (files.includes('cloned-snig-hi.json')) {
              voiceId = 'cloned-snig-hi';
            } else if (files.includes('cloned-snig-en.json')) {
              voiceId = 'cloned-snig-en';
            } else if (files.includes('cloned-snig.json')) {
              voiceId = 'cloned-snig';
            } else if (files.length > 0) {
              voiceId = path.basename(files[0], '.json');
            }
          }
        } else {
          // English/Default
          if (files.includes('default-en.json')) {
            voiceId = 'default-en';
          } else if (files.includes('default.json')) {
            voiceId = 'default';
          } else if (files.includes('standard-aiden-en.json')) {
            voiceId = 'standard-aiden-en';
          } else if (files.includes('standard-aiden.json')) {
            voiceId = 'standard-aiden';
          } else {
            const nonHiFile = files.find(f => !f.endsWith('-hi.json'));
            if (nonHiFile) {
              voiceId = path.basename(nonHiFile, '.json');
            } else if (files.length > 0) {
              voiceId = path.basename(files[0], '.json');
            }
          }
        }
      }
      
      if (!voiceId) {
        console.error('[render] Error: No voice profile found and none specified via --voice.');
        process.exit(1);
      }
      console.log(`[render] Resolved default voice to: ${voiceId}`);
    }

    // Ensure we have a Hindi-specific voice profile copy to cache the LMNT voice ID
    if (targetLang === 'hi' && !voiceId.endsWith('-hi')) {
      const voicesDir = path.join(projectRoot, 'clients', clientNameId, 'voices');
      const baseVoiceId = voiceId.endsWith('-en') ? voiceId.slice(0, -3) : voiceId;
      const baseVoicePath = path.join(voicesDir, `${voiceId}.json`);
      const hiVoiceId = `${baseVoiceId}-hi`;
      const hiVoicePath = path.join(voicesDir, `${hiVoiceId}.json`);

      if (fs.existsSync(baseVoicePath) && !fs.existsSync(hiVoicePath)) {
        console.log(`[render] Creating Hindi voice profile clone: ${hiVoiceId}.json`);
        try {
          const profile = JSON.parse(fs.readFileSync(baseVoicePath, 'utf8'));
          
          // Clean up engine-specific parameters that are not needed for LMNT
          delete profile.profile_id;
          delete profile.profile_name;
          delete profile.model_size;
          delete profile.default_engine;
          delete profile.model;
          delete profile.presetName;
          delete profile.instruct;
          
          profile.engine = 'lmnt';
          profile.language = 'hi';
          
          if (voiceId.includes('cloned') || profile.type === 'cloned' || profile.refAudio) {
            profile.type = 'cloned';
          }
          
          fs.writeFileSync(hiVoicePath, JSON.stringify(profile, null, 2));
        } catch (err: any) {
          console.warn(`[render] Warning: Failed to clone Hindi voice profile.`, err.message);
        }
      }
      if (fs.existsSync(hiVoicePath)) {
        voiceId = hiVoiceId;
      }
    }

    let voiceEngine = 'voicebox';
    console.log(`[render] Resolving voice config for voiceId: ${voiceId}…`);
    try {
      const voiceConfig = resolveVoiceConfig(projectRoot, clientNameId, voiceId);
      voiceEngine = voiceConfig.engine || 'voicebox';
      console.log(`[render] Voice engine: ${voiceEngine}`);
    } catch (err: any) {
      console.error(`[render] Error: Failed to resolve voice config.`, err.message);
      process.exit(1);
    }

    if (targetLang === 'hi') {
      voiceEngine = 'lmnt';
    }

    const pythonCmd = fs.existsSync(path.join(projectRoot, '..', 'browser-use-demo', '.venv', 'bin', 'python3'))
      ? path.join(projectRoot, '..', 'browser-use-demo', '.venv', 'bin', 'python3')
      : 'python3';

    const questionDirName = `${questionSlug}-d${duration}-${voiceId}`;
    const questionDir = path.join(projectRoot, 'tmp', 'questions', clientNameId, questionDirName);

    if (!fs.existsSync(questionDir)) {
      fs.mkdirSync(questionDir, { recursive: true });
    }
    const generatedAnswerPath = path.join(questionDir, 'generated_answer.txt');
    const synthesizedVoicePath = path.join(questionDir, 'synthesized_voice.mp3');
    const synthesizedQuestionPath = path.join(questionDir, 'synthesized_question.mp3');

    // Resolve a patient voice for the question
    let patientVoiceId = 'standard-vivian';
    const voicesDir = path.join(projectRoot, 'clients', clientNameId, 'voices');
    if (fs.existsSync(voicesDir)) {
      const files = fs.readdirSync(voicesDir).filter(f => f.endsWith('.json'));
      const voiceNames = files.map(f => path.basename(f, '.json'));
      if (voiceId.includes('snig') || voiceId.includes('vivian')) {
        if (voiceNames.includes('standard-aiden')) {
          patientVoiceId = 'standard-aiden';
        } else if (voiceNames.includes('standard-vivian')) {
          patientVoiceId = 'standard-vivian';
        } else {
          const fallback = voiceNames.find(v => v !== voiceId);
          if (fallback) patientVoiceId = fallback;
        }
      } else {
        if (voiceNames.includes('standard-vivian')) {
          patientVoiceId = 'standard-vivian';
        } else if (voiceNames.includes('standard-aiden')) {
          patientVoiceId = 'standard-aiden';
        } else {
          const fallback = voiceNames.find(v => v !== voiceId);
          if (fallback) patientVoiceId = fallback;
        }
      }
    }

    let skipQuestionGeneration = false;
    if (args.quick && fs.existsSync(generatedAnswerPath) && fs.existsSync(synthesizedVoicePath) && fs.existsSync(synthesizedQuestionPath)) {
      console.log(`[render] [quick] Found cached answer, voice, and question audio at: ${questionDir}. Reusing them.`);
      skipQuestionGeneration = true;
    }

    if (!skipQuestionGeneration) {
      console.log(`[render] Generating answer to: "${question}"…`);
      const model = (args.model as string) || 'gemma4:e4b';
      
      // Run generate_answer.py
      const genAnswerCmd = `"${pythonCmd}" "${path.join(projectRoot, 'cli', 'generate_answer.py')}" \
        --question "${question.replace(/"/g, '\\"')}" \
        --expert "${expert}" \
        --specialty "${specialty}" \
        --domain "${domain}" \
        --model "${model}" \
        --duration "${duration}" \
        --language "${targetLang}" \
        --provider "${voiceEngine}" \
        --output "${generatedAnswerPath}"`;

      try {
        execSync(genAnswerCmd, { stdio: 'inherit', cwd: projectRoot });
      } catch (err) {
        console.error('[render] Error: Answer generation failed.', err);
        process.exit(1);
      }

      const answerText = fs.readFileSync(generatedAnswerPath, 'utf8').trim();

      console.log(`[render] Synthesizing voice for resolved answer…`);
      // Run synthesize_voice.py
      const synthVoiceCmd = `"${pythonCmd}" "${path.join(projectRoot, 'cli', 'synthesize_voice.py')}" \
        --client "${clientNameId}" \
        --voice "${voiceId}" \
        --text "${answerText.replace(/"/g, '\\"')}" \
        --language "${targetLang}" \
        --output "${synthesizedVoicePath}"`;

      try {
        execSync(synthVoiceCmd, { stdio: 'inherit', cwd: projectRoot });
      } catch (err) {
        console.error('[render] Error: Voice synthesis failed.', err);
        process.exit(1);
      }

      console.log(`[render] Synthesizing voice for question using voice '${patientVoiceId}'…`);
      // Run synthesize_voice.py for question
      const synthQuestionCmd = `"${pythonCmd}" "${path.join(projectRoot, 'cli', 'synthesize_voice.py')}" \
        --client "${clientNameId}" \
        --voice "${patientVoiceId}" \
        --text "${question.replace(/"/g, '\\"')}" \
        --language "${targetLang}" \
        --output "${synthesizedQuestionPath}"`;

      try {
        execSync(synthQuestionCmd, { stdio: 'inherit', cwd: projectRoot });
      } catch (err) {
        console.error('[render] Error: Question voice synthesis failed.', err);
        process.exit(1);
      }
    }

    audio = synthesizedVoicePath;
  }

  // Validate that input audio file exists
  if (!audio && !args.props) {
    console.error('[render] Error: Either --audio, --props, or --question must be provided.');
    process.exit(1);
  }
  if (audio && !fs.existsSync(audio)) {
    console.error(`[render] Error: Audio file not found at ${audio}`);
    process.exit(1);
  }

  const model = (args.model as string) || 'gemma4:e4b';
  const whisperModel = (args.whisper_model as string) || 'small';
  const preview = !!args.preview;
  
  // Resolve Cache Directory and File Path structured under <client-id>/<run-info>
  const safeClientId = clientNameId || 'manual';
  let audioName = audio ? path.basename(audio, path.extname(audio)) : 'no-audio';
  if (question) {
    const questionSlug = getSlug(question, 'question');
    audioName = `${questionSlug}-d${duration}-${voiceId || 'default'}`;
  }
  const cacheDir = path.join(projectRoot, 'tmp', 'cache', safeClientId);
  const cacheFilePath = path.join(cacheDir, `${audioName}-${designId}.json`);

  let propsPath = (args.props as string) || cacheFilePath;
  let skipAiPipeline = !!args['skip-ai'];

  if (!args.props && !args['skip-ai']) {
    if (args.force) {
      console.log(`[render] [force] Bypassing cache, forcing fresh transcription & metadata generation.`);
      fs.mkdirSync(cacheDir, { recursive: true });
    } else if (args.quick) {
      if (fs.existsSync(cacheFilePath)) {
        console.log(`[render] [quick] Found cached run data at ${cacheFilePath}. Reusing transcription and metadata.`);
        skipAiPipeline = true;
      } else {
        console.log(`[render] [quick] No cache found at ${cacheFilePath}. Generating new metadata and caching it.`);
        fs.mkdirSync(cacheDir, { recursive: true });
      }
    } else {
      // Smart default: If cache exists, reuse it. Otherwise, generate and cache.
      if (fs.existsSync(cacheFilePath)) {
        console.log(`[render] Found cached run data at ${cacheFilePath}. Reusing transcription & metadata. (Pass --force to run from scratch)`);
        skipAiPipeline = true;
      } else {
        console.log(`[render] No cache found. Running AI pipeline and caching output at ${cacheFilePath}...`);
        fs.mkdirSync(cacheDir, { recursive: true });
      }
    }
  }

  // Step 1: Run AI pipeline if not skipping
  if (!args.props && !skipAiPipeline) {
    console.log('[render] Running AI pipeline (Transcription + Metadata)...');
    
    // Pass CTA personalization context from design config
    const ctaHandle = clientProps.ctaHandle || '';
    const ctaLink = clientProps.ctaLink || '';

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
    if (ctaHandle) {
      pipelineCmd += ` --cta-handle "${ctaHandle}"`;
    }
    if (ctaLink) {
      pipelineCmd += ` --cta-link "${ctaLink}"`;
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

  // Step 2b: Ensure programmatic sound effects are generated
  const sfxDir = path.join(projectRoot, 'public', 'audio', 'sfx');
  const requiredSfx = ['boom.wav', 'whoosh.wav', 'pop.wav', 'ding.wav', 'click.wav'];
  const missingSfx = requiredSfx.some(file => !fs.existsSync(path.join(sfxDir, file)));
  if (missingSfx) {
    console.log('[render] Missing sound effects detected. Generating them now...');
    try {
      execSync(`python3 "${path.join(projectRoot, 'cli', 'generate_sfx.py')}"`, { stdio: 'inherit', cwd: projectRoot });
    } catch (err) {
      console.warn('[render] Warning: Failed to generate sound effects.', err);
    }
  }

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
    
    let audioDestFilename = path.basename(audioSrcFile);
    if (question) {
      audioDestFilename = `${audioName}.mp3`;
    }
    const audioDestPath = path.join(publicAudioDir, audioDestFilename);
    
    console.log(`[render] Copying audio asset to public: ${audioDestPath}`);
    fs.copyFileSync(audioSrcFile, audioDestPath);
    
    props.audioUrl = `audio/${audioDestFilename}`;

    if (question) {
      let patientVoiceId = 'standard-vivian';
      const questionDir = path.dirname(audioSrcFile);
      const synthesizedQuestionPath = path.join(questionDir, 'synthesized_question.mp3');
      
      const voicesDir = path.join(projectRoot, 'clients', clientNameId, 'voices');
      if (fs.existsSync(voicesDir)) {
        const files = fs.readdirSync(voicesDir).filter(f => f.endsWith('.json'));
        const voiceNames = files.map(f => path.basename(f, '.json'));
        if (voiceId.includes('snig') || voiceId.includes('vivian')) {
          if (voiceNames.includes('standard-aiden')) {
            patientVoiceId = 'standard-aiden';
          } else if (voiceNames.includes('standard-vivian')) {
            patientVoiceId = 'standard-vivian';
          } else {
            const fallback = voiceNames.find(v => v !== voiceId);
            if (fallback) patientVoiceId = fallback;
          }
        } else {
          if (voiceNames.includes('standard-vivian')) {
            patientVoiceId = 'standard-vivian';
          } else if (voiceNames.includes('standard-aiden')) {
            patientVoiceId = 'standard-aiden';
          } else {
            const fallback = voiceNames.find(v => v !== voiceId);
            if (fallback) patientVoiceId = fallback;
          }
        }
      }

      if (fs.existsSync(synthesizedQuestionPath)) {
        const questionDestFilename = `${questionSlug}-q-${patientVoiceId}.mp3`;
        const questionDestPath = path.join(publicAudioDir, questionDestFilename);
        console.log(`[render] Copying question audio asset to public: ${questionDestPath}`);
        fs.copyFileSync(synthesizedQuestionPath, questionDestPath);
        props.patientQuestionAudioUrl = `audio/${questionDestFilename}`;
      } else {
        props.patientQuestionAudioUrl = '';
      }
    }
  } else {
    console.warn(`[render] Warning: Audio file source '${audioSrcFile}' was not found or is empty.`);
  }

  // Apply resolved config properties / manual overrides
  if (clientNameId) {
    // Merge all client resolved properties (theme, assets, hook style, etc)
    Object.assign(props, clientProps);
    // If design config locked a hookStyle, only override if LLM didn't already set one
    // (design config hookStyle takes priority over LLM selection)
    if (clientProps.hookStyle) {
      props.hookStyle = clientProps.hookStyle;
    }
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

  // CLI Hook Style Override (highest priority)
  if (args['hook-style']) {
    props.hookStyle = args['hook-style'] as string;
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
    const renderCmd = `npx remotion render "${rootPath}" "${template}" "${finalOutPath}" --props="${updatedPropsPath}" --codec=h264 --timeout=120000`;
    
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

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function main() {
  const args = parseArgs();

  // Show help if requested or missing required arguments
  if (args.help || (!args.audio && !args.props)) {
    console.log(`
ReelForge CLI Video Render Orchestrator
---------------------------------------
Usage:
  npx tsx cli/render.ts \\
    --audio ./samples/expert-advice.mp3 \\
    --expert "Dr. Priya Sharma" \\
    --specialty "Dermatologist" \\
    --domain "Skincare" \\
    --template hook-quote \\
    --out ./out/video.mp4

Options:
  --audio <path>          Path to the local expert audio file
  --expert <name>         Name of the expert
  --specialty <title>     Title/specialty of the expert
  --domain <name>         Domain/niche (e.g. Skincare, Finance)
  --template <name>       Template: "hook-quote" or "minimal-podcast" (default: hook-quote)
  --out <path>            Output path for the rendered MP4 (default: ./out/video.mp4)
  --model <model>         Ollama model (default: gemma4:e4b)
  --whisper-model <size>  Whisper model size (default: small)
  --accent-color <hex>    Accent color code override (e.g. #FF6B35)
  --skip-ai               Skip transcription/LLM (uses existing tmp/props.json)
  --props <path>          Path to a pre-generated props.json (skips AI entirely)
  --preview               Open Remotion Studio instead of rendering
    `);
    process.exit(0);
  }

  const template = (args.template as string) || 'hook-quote';
  const outPath = (args.out as string) || './out/video.mp4';
  const model = (args.model as string) || 'gemma4:e4b';
  const whisperModel = (args.whisper_model as string) || 'small';
  const preview = !!args.preview;
  
  let propsPath = (args.props as string) || path.join(projectRoot, 'tmp', 'props.json');

  // Step 1: Run AI pipeline if not using custom props
  if (!args.props && !args['skip-ai']) {
    const audio = args.audio as string;
    const expert = args.expert as string;
    const specialty = args.specialty as string;
    const domain = args.domain as string;

    if (!audio || !expert || !specialty || !domain) {
      console.error('[render] Error: --audio, --expert, --specialty, and --domain are required unless --props is specified.');
      process.exit(1);
    }

    if (!fs.existsSync(audio)) {
      console.error(`[render] Error: Audio file not found at ${audio}`);
      process.exit(1);
    }

    console.log('[render] Running AI pipeline (Transcription + Metadata)...');
    
    const pipelineCmd = `uv run --with faster-whisper --with requests python3 "${path.join(projectRoot, 'cli', 'pipeline.py')}" \
      --audio "${audio}" \
      --expert "${expert}" \
      --specialty "${specialty}" \
      --domain "${domain}" \
      --template "${template}" \
      --model "${model}" \
      --whisper-model "${whisperModel}" \
      --output "${propsPath}"`;

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
  if (args.audio) {
    audioSrcFile = args.audio as string;
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
    
    // Set relative path for Remotion staticFile resolver
    props.audioUrl = `audio/${audioDestFilename}`;
  } else {
    console.warn(`[render] Warning: Audio file source '${audioSrcFile}' was not found or is empty.`);
  }

  // Handle color override if provided
  if (args['accent-color']) {
    props.accentColor = args['accent-color'] as string;
  }

  // Save the updated props back to temp path
  const updatedPropsPath = path.join(projectRoot, 'tmp', 'props-resolved.json');
  fs.mkdirSync(path.dirname(updatedPropsPath), { recursive: true });
  fs.writeFileSync(updatedPropsPath, JSON.stringify(props, null, 2));

  // Step 4: Render or Preview via Remotion CLI
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
    const absOutPath = path.resolve(projectRoot, outPath);
    fs.mkdirSync(path.dirname(absOutPath), { recursive: true });
    
    console.log(`[render] Rendering video composition '${template}' to: ${absOutPath}...`);
    const renderCmd = `npx remotion render "${rootPath}" "${template}" "${absOutPath}" --props="${updatedPropsPath}" --codec=h264`;
    
    try {
      execSync(renderCmd, { stdio: 'inherit', cwd: projectRoot });
      console.log(`\n[render] ✅ Render successful! Output file: ${absOutPath}`);
    } catch (err) {
      console.error('[render] Error: Remotion render failed.', err);
      process.exit(1);
    }
  }
}

main();

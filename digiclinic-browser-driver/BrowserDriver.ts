import { spawn, ChildProcess } from 'child_process';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

/** Structured response so an AI can easily parse success vs failure */
export type ToolResult = {
    success: boolean;
    data?: string | null;
    error?: string;
    errorType?: 'PROTOCOL_ERROR' | 'TIMEOUT' | 'ELEMENT_NOT_FOUND' | 'UNKNOWN';
};

/** Minimal inputs to override defaults */
export interface NavigateOptions { url: string; newTab?: boolean; }
export interface WaitOptions { selector?: string; timeout?: number; }
export interface FillOptions { selector: string; value: string; }
export interface ClickOptions { selector: string; }
export interface ScreenshotOptions { path?: string; }
export interface DismissOptions { scope?: 'non_critical' | 'aggressive'; maxPasses?: number; }

// ==========================================
// 2. LOW-LEVEL MCP STDIO CLIENT
// ==========================================

/** Handles standard Newline-Delimited JSON (NDJSON) over STDIO for MCP */
class McpStdioClient {
    private process: ChildProcess;
    private requestId = 0;
    private pendingRequests = new Map<number, { resolve: Function; reject: Function; timer: NodeJS.Timeout }>();
    private buffer = '';

    constructor(serverCommand: string) {
        // Spawn npm/npx safely. Using '--silent' avoids npm output clutter.
        this.process = spawn('npx', ['-y', '--silent', serverCommand], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.process.stderr!.on('data', (data) => {
            console.debug(`[MCP STDERR] ${data.toString().trim()}`);
        });

        this.process.stdout!.on('data', (chunk) => {
            this.buffer += chunk.toString();
            this.processBuffer();
        });

        this.process.on('close', (code) => {
            if (code !== 0 && code !== null) {
                console.error(`MCP Process exited with code ${code}`);
                this.pendingRequests.forEach(req => req.reject(new Error(`MCP Process crashed with exit code ${code}`)));
            }
        });
    }

    private processBuffer() {
        while (true) {
            const newlineIndex = this.buffer.indexOf('\n');
            if (newlineIndex === -1) break;

            const line = this.buffer.substring(0, newlineIndex).trim();
            this.buffer = this.buffer.substring(newlineIndex + 1);

            if (line.length === 0) continue; // Skip empty lines

            try {
                const message = JSON.parse(line);
                const pending = this.pendingRequests.get(message.id);
                if (pending) {
                    clearTimeout(pending.timer);
                    this.pendingRequests.delete(message.id);
                    if (message.error) {
                        pending.reject(message.error);
                    } else {
                        pending.resolve(message.result);
                    }
                }
            } catch (e) {
                // If it's not a JSON-RPC message for a pending request, log it as debug info
                console.debug(`[MCP RAW DATA] ${line}`);
            }
        }
    }

    private async send(method: string, params: any = {}, timeoutMs: number = 60000): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            const payload = { jsonrpc: '2.0', id, method, params };
            const jsonStr = JSON.stringify(payload) + '\n';

            const timer = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`MCP Timeout after ${timeoutMs}ms for ${method}`));
            }, timeoutMs);

            this.pendingRequests.set(id, { resolve, reject, timer });
            this.process.stdin!.write(jsonStr);
        });
    }

    async initialize() {
        await this.send('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'digiclinic-ts-driver', version: '1.0.0' }
        });
        // Send initialized notification (no ID)
        const notif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n';
        this.process.stdin!.write(notif);
    }

    async callTool(name: string, args: any, timeoutMs?: number): Promise<any> {
        return this.send('tools/call', { name, arguments: args }, timeoutMs);
    }

    kill() {
        this.process.kill();
    }
}

// ==========================================
// 3. HIGH-LEVEL BROWSER CONTROLLER (For AI / Workflows)
// ==========================================

export class BrowserDriver {
    private client: McpStdioClient;

    /** 
     * @param mcpPackage The npm package name to spawn (e.g., '@ankur18/browser-mcp')
     */
    constructor(private mcpPackage: string = '@ankur18/browser-mcp') {
        this.client = new McpStdioClient(this.mcpPackage);
    }

    async connect() {
        await this.client.initialize();
        console.debug('[Driver] Connected to MCP Server.');
    }

    /** Helper to safely parse tool responses into a structured ToolResult */
    private async executeTool(toolName: string, args: any, timeoutMs?: number): Promise<ToolResult> {
        try {
            const response = await this.client.callTool(toolName, args, timeoutMs);
            
            // MCP standard puts output in content[0].text
            const text = response?.content?.[0]?.text || '';

            // Intelligent error detection based on common browser-mcp error strings
            const lowerText = text.toLowerCase();
            if (lowerText.includes('element not found') || lowerText.includes('no element found') || lowerText.includes('unable to find element')) {
                return { success: false, data: text, error: text, errorType: 'ELEMENT_NOT_FOUND' };
            }
            if (lowerText.includes('timeout') || lowerText.includes('timed out')) {
                return { success: false, data: text, error: text, errorType: 'TIMEOUT' };
            }
            if (lowerText.includes('error') || lowerText.includes('failed')) {
                return { success: false, data: text, error: text, errorType: 'UNKNOWN' };
            }

            return { success: true, data: text };
        } catch (err: any) {
            const msg = err.message || '';
            let errorType: ToolResult['errorType'] = 'UNKNOWN';
            if (msg.includes('Timeout')) {
                errorType = 'TIMEOUT';
            } else if (msg.includes('crashed') || msg.includes('exit')) {
                errorType = 'PROTOCOL_ERROR';
            }
            return { 
                success: false, 
                data: null, 
                error: msg || 'Unknown execution error', 
                errorType 
            };
        }
    }

    // --- Exposed Workflow Methods ---

    async navigate(opts: NavigateOptions): Promise<ToolResult> {
        return this.executeTool('browser_navigate', { url: opts.url, newTab: opts.newTab ?? false });
    }

    async dismissOverlays(opts: DismissOptions = {}): Promise<ToolResult> {
        return this.executeTool('browser_dismiss_overlays', { 
            scope: opts.scope ?? 'non_critical', 
            maxPasses: opts.maxPasses ?? 3 
        });
    }

    async wait(opts: WaitOptions = {}): Promise<ToolResult> {
        if (!opts.selector) throw new Error("Selector is required for wait");
        return this.executeTool('browser_wait', { 
            selector: opts.selector, 
            timeout: opts.timeout ?? 10000 
        }, (opts.timeout ?? 10000) + 5000); // Add buffer to MCP timeout
    }

    async fill(opts: FillOptions): Promise<ToolResult> {
        return this.executeTool('browser_fill', { selector: opts.selector, value: opts.value });
    }

    async click(opts: ClickOptions): Promise<ToolResult> {
        return this.executeTool('browser_click', { selector: opts.selector });
    }

    async pressKey(key: string): Promise<ToolResult> {
        return this.executeTool('browser_press_key', { key });
    }

    async waitForNetwork(timeout: number = 15000): Promise<ToolResult> {
        return this.executeTool('browser_wait_for_network', { timeout }, timeout + 5000);
    }

    async getContent(format: 'text' | 'html' = 'text'): Promise<ToolResult> {
        return this.executeTool('browser_get_page_content', { format });
    }

    async screenshot(opts: ScreenshotOptions = {}): Promise<ToolResult> {
        return this.executeTool('browser_screenshot', { path: opts.path });
    }

    async scroll(y: number = 500): Promise<ToolResult> {
        return this.executeTool('browser_scroll', { y });
    }

    async executeScript(code: string): Promise<ToolResult> {
        return this.executeTool('browser_execute_script', { code });
    }

    disconnect() {
        this.client.kill();
    }
}

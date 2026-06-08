export interface ProviderBrandInfo {
  label: string
  iconModel: string | null
  iconUrl?: string
  background: string
  color: string
  border: string
}

export interface AILogoPreset {
  id: string
  label: string
  url: string
}

type ProviderBrandPreset = Omit<ProviderBrandInfo, 'label'> & {
  label?: string
}

export interface AILogoRuntimeConfig {
  ai_logo_cdn_base_url?: string | null
  custom_ai_logo_presets?: string[] | null
}

export const defaultAILogoCDNBaseURL = 'https://unpkg.com/@lobehub/icons-static-png@1.91.0/light'

let runtimeAILogoCDNBaseURL = defaultAILogoCDNBaseURL
let runtimeCustomAILogoPresetURLs: string[] = []

const aiLogoUrl = (slug: string) => `${runtimeAILogoCDNBaseURL}/${slug}.png`

const aiLogoPresetSources = [
  { id: 'openai', label: 'OpenAI', slug: 'openai' },
  { id: 'claude', label: 'Claude', slug: 'claude-color', aliases: ['anthropic', 'claudeapi'] },
  { id: 'anthropic', label: 'Anthropic', slug: 'anthropic' },
  { id: 'gemini', label: 'Gemini', slug: 'gemini-color', aliases: ['google-ai-studio', 'aistudio'] },
  { id: 'google', label: 'Google', slug: 'google-color' },
  { id: 'geminicli', label: 'Gemini CLI', slug: 'geminicli-color', aliases: ['gemini-cli'] },
  { id: 'claudecode', label: 'Claude Code', slug: 'claudecode-color', aliases: ['claude-code', 'claude-code-router'] },
  { id: 'codex', label: 'Codex', slug: 'codex-color' },
  { id: 'bailian', label: 'Bailian', slug: 'bailian-color' },
  { id: 'deepseek', label: 'DeepSeek', slug: 'deepseek-color' },
  { id: 'doubao', label: 'Doubao', slug: 'doubao-color' },
  { id: 'volcengine', label: 'Volcengine', slug: 'volcengine-color', aliases: ['volc'] },
  { id: 'qwen', label: 'Qwen', slug: 'qwen-color', aliases: ['dashscope', 'tongyi'] },
  { id: 'alibaba', label: 'Alibaba', slug: 'alibaba-color' },
  { id: 'alibabacloud', label: 'Alibaba Cloud', slug: 'alibabacloud-color', aliases: ['aliyun'] },
  { id: 'tencentcloud', label: 'Tencent Cloud', slug: 'tencentcloud-color' },
  { id: 'huawei', label: 'Huawei', slug: 'huawei-color' },
  { id: 'baichuan', label: 'Baichuan', slug: 'baichuan-color' },
  { id: 'stepfun', label: 'StepFun', slug: 'stepfun-color' },
  { id: 'kimi', label: 'Kimi', slug: 'kimi-color' },
  { id: 'moonshot', label: 'Moonshot', slug: 'moonshot' },
  { id: 'yi', label: '01.AI Yi', slug: 'yi-color', aliases: ['01ai', 'lingyiwanwu'] },
  { id: 'zhipu', label: 'Zhipu', slug: 'zhipu-color', aliases: ['glm', 'chatglm'] },
  { id: 'baidu', label: 'Baidu', slug: 'baidu-color', aliases: ['ernie', 'wenxin'] },
  { id: 'spark', label: 'Spark', slug: 'spark-color', aliases: ['iflytek', 'xinghuo'] },
  { id: 'hunyuan', label: 'Hunyuan', slug: 'hunyuan-color', aliases: ['tencent'] },
  { id: 'minimax', label: 'MiniMax', slug: 'minimax-color', aliases: ['abab'] },
  { id: 'ai360', label: '360 AI', slug: 'ai360-color', aliases: ['360'] },
  { id: 'siliconcloud', label: 'SiliconCloud', slug: 'siliconcloud-color' },
  { id: 'modelscope', label: 'ModelScope', slug: 'modelscope-color' },
  { id: 'openrouter', label: 'OpenRouter', slug: 'openrouter' },
  { id: 'mistral', label: 'Mistral', slug: 'mistral-color', aliases: ['mixtral', 'codestral'] },
  { id: 'cohere', label: 'Cohere', slug: 'cohere-color', aliases: ['command', 'commanda'] },
  { id: 'perplexity', label: 'Perplexity', slug: 'perplexity-color', aliases: ['pplx'] },
  { id: 'grok', label: 'Grok', slug: 'grok' },
  { id: 'xai', label: 'xAI', slug: 'xai' },
  { id: 'cloudflare', label: 'Cloudflare', slug: 'cloudflare-color' },
  { id: 'meta', label: 'Meta', slug: 'meta-color', aliases: ['llama'] },
  { id: 'aws', label: 'AWS', slug: 'aws-color' },
  { id: 'bedrock', label: 'Bedrock', slug: 'bedrock-color' },
  { id: 'azure', label: 'Azure', slug: 'azure-color' },
  { id: 'azureai', label: 'Azure AI', slug: 'azureai-color', aliases: ['azure-ai'] },
  { id: 'vertexai', label: 'Vertex AI', slug: 'vertexai-color', aliases: ['vertex', 'vertex-ai', 'vertex_ai'] },
  { id: 'groq', label: 'Groq', slug: 'groq' },
  { id: 'together', label: 'Together AI', slug: 'together-color' },
  { id: 'fireworks', label: 'Fireworks', slug: 'fireworks-color' },
  { id: 'huggingface', label: 'Hugging Face', slug: 'huggingface-color', aliases: ['hugging-face'] },
  { id: 'replicate', label: 'Replicate', slug: 'replicate' },
  { id: 'voyage', label: 'Voyage AI', slug: 'voyage-color' },
  { id: 'ai21', label: 'AI21', slug: 'ai21' },
  { id: 'nvidia', label: 'NVIDIA', slug: 'nvidia-color' },
  { id: 'cerebras', label: 'Cerebras', slug: 'cerebras-color' },
  { id: 'deepinfra', label: 'DeepInfra', slug: 'deepinfra-color' },
  { id: 'novita', label: 'Novita', slug: 'novita-color' },
  { id: 'ollama', label: 'Ollama', slug: 'ollama' },
  { id: 'openwebui', label: 'Open WebUI', slug: 'openwebui' },
  { id: 'newapi', label: 'New API', slug: 'newapi-color', aliases: ['new-api'] },
  { id: 'aihubmix', label: 'AIHubMix', slug: 'aihubmix-color' },
  { id: 'cursor', label: 'Cursor', slug: 'cursor' },
  { id: 'copilot', label: 'Copilot', slug: 'copilot-color' },
  { id: 'github', label: 'GitHub', slug: 'github' },
  { id: 'v0', label: 'v0', slug: 'v0' },
  { id: 'vercel', label: 'Vercel', slug: 'vercel' },
  { id: 'windsurf', label: 'Windsurf', slug: 'windsurf' },
  { id: 'trae', label: 'Trae', slug: 'trae-color' },
  { id: 'jina', label: 'Jina', slug: 'jina' },
  { id: 'midjourney', label: 'Midjourney', slug: 'midjourney' },
  { id: 'suno', label: 'Suno', slug: 'suno' },
  { id: 'dify', label: 'Dify', slug: 'dify-color' },
  { id: 'coze', label: 'Coze', slug: 'coze' },
  { id: 'fastgpt', label: 'FastGPT', slug: 'fastgpt-color' },
  { id: 'langchain', label: 'LangChain', slug: 'langchain-color' },
  { id: 'llamaindex', label: 'LlamaIndex', slug: 'llamaindex-color' },
  { id: 'poe', label: 'Poe', slug: 'poe-color' },
  { id: 'phind', label: 'Phind', slug: 'phind' },
  { id: 'exa', label: 'Exa', slug: 'exa-color' },
  { id: 'dalle', label: 'DALL-E', slug: 'dalle-color', aliases: ['dall-e'] },
  { id: 'elevenlabs', label: 'ElevenLabs', slug: 'elevenlabs' },
  { id: 'stability', label: 'Stability AI', slug: 'stability-color' },
  { id: 'flux', label: 'FLUX', slug: 'flux' },
  { id: 'fal', label: 'fal', slug: 'fal-color' },
  { id: 'runway', label: 'Runway', slug: 'runway' },
  { id: 'kling', label: 'Kling', slug: 'kling-color' },
  { id: 'hailuo', label: 'Hailuo', slug: 'hailuo-color' },
  { id: 'pika', label: 'Pika', slug: 'pika' },
  { id: 'luma', label: 'Luma', slug: 'luma-color' },
]

function buildAILogoPresets(): AILogoPreset[] {
  return aiLogoPresetSources.map((preset) => ({
    id: preset.id,
    label: preset.label,
    url: aiLogoUrl(preset.slug),
  }))
}

export const aiLogoPresets: AILogoPreset[] = aiLogoPresetSources.map((preset) => ({
  id: preset.id,
  label: preset.label,
  url: `${defaultAILogoCDNBaseURL}/${preset.slug}.png`,
}))

function normalizeLogoURL(raw?: string | null): string {
  const value = (raw || '').trim()
  if (!value) return ''
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
    return parsed.toString()
  } catch {
    return ''
  }
}

function normalizeAILogoCDNBaseURL(raw?: string | null): string {
  const url = normalizeLogoURL(raw)
  return url ? url.replace(/\/+$/, '') : defaultAILogoCDNBaseURL
}

function customLogoPresetId(url: string): string {
  try {
    const parsed = new URL(url)
    const lastPath = parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname
    return `custom-${lastPath.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'logo'}`
  } catch {
    return 'custom-logo'
  }
}

function normalizeCustomAILogoPresetURLs(urls?: Array<string | null | undefined> | null): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of urls ?? []) {
    const url = normalizeLogoURL(item)
    if (!url || seen.has(url)) continue
    seen.add(url)
    result.push(url)
    if (result.length >= 48) break
  }
  return result
}

export function setAILogoRuntimeConfig(config?: AILogoRuntimeConfig | null) {
  runtimeAILogoCDNBaseURL = normalizeAILogoCDNBaseURL(config?.ai_logo_cdn_base_url)
  runtimeCustomAILogoPresetURLs = normalizeCustomAILogoPresetURLs(config?.custom_ai_logo_presets)
}

export function rememberCustomAILogoPreset(rawURL?: string | null): AILogoPreset[] {
  const url = normalizeLogoURL(rawURL)
  if (!url) return getMergedAILogoPresets()
  const systemPresets = buildAILogoPresets()
  if (systemPresets.some((preset) => preset.url === url)) return getMergedAILogoPresets()
  runtimeCustomAILogoPresetURLs = normalizeCustomAILogoPresetURLs([
    url,
    ...runtimeCustomAILogoPresetURLs,
  ])
  return getMergedAILogoPresets()
}

export function getCustomAILogoPresets(): AILogoPreset[] {
  return runtimeCustomAILogoPresetURLs.map((url) => ({
    id: customLogoPresetId(url),
    label: 'Custom logo',
    url,
  }))
}

export function getMergedAILogoPresets(): AILogoPreset[] {
  const systemPresets = buildAILogoPresets()
  const seen = new Set(systemPresets.map((preset) => preset.url))
  const custom = getCustomAILogoPresets().filter((preset) => {
    if (seen.has(preset.url)) return false
    seen.add(preset.url)
    return true
  })
  return [...systemPresets, ...custom]
}

export function isSystemAILogoPresetURL(rawURL?: string | null): boolean {
  const url = normalizeLogoURL(rawURL)
  if (!url) return false
  return buildAILogoPresets().some((preset) => preset.url === url)
    || aiLogoPresets.some((preset) => preset.url === url)
}

const fallbackPalettes = [
  { background: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  { background: '#EAF2FF', color: '#002FA7', border: '#B7D4FF' },
  { background: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  { background: '#FDF2F8', color: '#BE185D', border: '#FBCFE8' },
  { background: '#EAF2FF', color: '#002FA7', border: '#B7D4FF' },
  { background: '#F0FDFA', color: '#0F766E', border: '#99F6E4' },
  { background: '#FEFCE8', color: '#A16207', border: '#FEF08A' },
  { background: '#F8FAFC', color: '#475569', border: '#CBD5E1' },
]

const providerBrandMap: Array<[string[], ProviderBrandPreset]> = [
  [
    ['text-completion-openai', 'openai', 'azure-openai'],
    { iconModel: 'gpt', label: 'AI', background: '#E9FBF4', color: '#087F5B', border: '#9BE7C4' },
  ],
  [
    ['anthropic', 'claude'],
    { iconModel: 'claude', label: 'CL', background: '#FFF4E8', color: '#C05621', border: '#FBD38D' },
  ],
  [
    ['gemini', 'google-ai-studio'],
    { iconModel: 'gemini', label: 'G', background: '#EAF2FF', color: '#002FA7', border: '#B7D4FF' },
  ],
  [
    ['antigravity'],
    { iconModel: 'antigravity', label: 'AG', background: '#EAF2FF', color: '#002FA7', border: '#9DB6FF' },
  ],
  [
    ['deepseek'],
    { iconModel: 'deepseek', label: 'DS', background: '#EEF2FF', color: '#4D6BFE', border: '#C7D2FE' },
  ],
  [
    ['volcengine', 'doubao', 'bytedance'],
    { iconModel: 'doubao', label: 'DB', background: '#EEF6FF', color: '#1C64F2', border: '#BBD7FF' },
  ],
  [
    ['openrouter'],
    { iconModel: 'openrouter', label: 'OR', background: '#F0F0FF', color: '#6566F1', border: '#C7C8FF' },
  ],
  [
    ['buzzai', 'buzz'],
    { iconModel: null, label: 'BZ', background: '#FFF8DB', color: '#9A6A00', border: '#E8C45B' },
  ],
  [
    ['qlhazycoder', 'qlhazy'],
    { iconModel: null, label: 'QL', background: '#EAF2FF', color: '#002FA7', border: '#B7D4FF' },
  ],
  [
    ['packycode', 'packyapi', 'packy'],
    { iconModel: null, label: 'PK', background: '#F0FDFA', color: '#0F766E', border: '#99F6E4' },
  ],
  [
    ['tcdmx'],
    { iconModel: null, label: 'TC', background: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  ],
  [
    ['xhyapi', 'xhy'],
    { iconModel: null, label: 'XH', background: '#EEF2FF', color: '#4D6BFE', border: '#C7D2FE' },
  ],
  [
    ['ai-pixel', 'pixel'],
    { iconModel: null, label: 'PX', background: '#FDF2F8', color: '#BE185D', border: '#FBCFE8' },
  ],
  [
    ['liust'],
    { iconModel: null, label: 'LS', background: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  ],
  [
    ['mistral', 'codestral', 'mixtral'],
    { iconModel: 'mistral', label: 'MI', background: '#FFF8DB', color: '#A16207', border: '#F7D046' },
  ],
  [
    ['qwen', 'dashscope', 'aliyun', 'alibaba'],
    { iconModel: 'qwen', label: 'QW', background: '#F0F0FF', color: '#615EFF', border: '#C7C5FF' },
  ],
  [
    ['cohere'],
    { iconModel: 'command', label: 'CO', background: '#EEF8F3', color: '#39594D', border: '#B7DAC9' },
  ],
  [
    ['perplexity', 'pplx'],
    { iconModel: 'perplexity', label: 'PX', background: '#EAFBFD', color: '#0891A5', border: '#A5F3FC' },
  ],
  [
    ['moonshot', 'kimi'],
    { iconModel: 'moonshot', label: 'KM', background: '#EEF2F7', color: '#334155', border: '#CBD5E1' },
  ],
  [
    ['zhipu', 'glm', 'chatglm'],
    { iconModel: 'glm', label: 'GL', background: '#EEF2FF', color: '#3859FF', border: '#C7D2FE' },
  ],
  [
    ['xai', 'grok'],
    { iconModel: 'grok', label: 'xA', background: '#ECFEFF', color: '#0E7490', border: '#A5F3FC' },
  ],
  [
    ['ollama'],
    { iconModel: 'ollama', label: 'OL', background: '#EEF8F3', color: '#2F7D59', border: '#A7D9BF' },
  ],
  [
    ['cloudflare'],
    { iconModel: '@cf/', label: 'CF', background: '#FFF3E8', color: '#F38020', border: '#FDBA74' },
  ],
  [
    ['meta', 'llama'],
    { iconModel: 'llama', label: 'ME', background: '#EAF3FF', color: '#0668E1', border: '#BBD7FF' },
  ],
  [
    ['baidu', 'wenxin', 'ernie'],
    { iconModel: 'ernie', label: 'BD', background: '#EAF4FF', color: '#167ADF', border: '#B7D8FF' },
  ],
  [
    ['iflytek', 'spark', 'xinghuo'],
    { iconModel: 'spark', label: 'SP', background: '#EAF4FF', color: '#0070F0', border: '#B7D8FF' },
  ],
  [
    ['tencent', 'hunyuan'],
    { iconModel: 'hunyuan', label: 'HY', background: '#EAF2FF', color: '#0053E0', border: '#BBD0FF' },
  ],
  [
    ['minimax', 'abab'],
    { iconModel: 'minimax', label: 'MM', background: '#FFF1F4', color: '#F23F5D', border: '#FFC2CE' },
  ],
  [
    ['jina'],
    { iconModel: 'jina', label: 'JI', background: '#FFF1F6', color: '#D9487D', border: '#F9B4CC' },
  ],
  [
    ['midjourney'],
    { iconModel: 'midjourney', label: 'MJ', background: '#EAF2FF', color: '#002FA7', border: '#B7D4FF' },
  ],
  [
    ['suno'],
    { iconModel: 'suno', label: 'SU', background: '#FFF4ED', color: '#FF5A1F', border: '#FDBA74' },
  ],
  [
    ['360', 'ai360'],
    { iconModel: '360', label: '36', background: '#EAFBFF', color: '#0891B2', border: '#A5F3FC' },
  ],
  [
    ['dify'],
    { iconModel: 'dify', label: 'DF', background: '#EAF2FF', color: '#1677FF', border: '#BBD7FF' },
  ],
  [
    ['coze'],
    { iconModel: 'coze', label: 'CZ', background: '#F0EDFF', color: '#5436F5', border: '#C4B5FD' },
  ],
  [
    ['bedrock', 'aws'],
    { iconModel: null, label: 'AWS', background: '#FFF7E8', color: '#C76A00', border: '#FFB347' },
  ],
  [
    ['vertex_ai', 'vertex-ai', 'vertexai', 'google'],
    { iconModel: null, label: 'G', background: '#E8F0FE', color: '#1A73E8', border: '#AECBFA' },
  ],
  [
    ['azure'],
    { iconModel: null, label: 'Az', background: '#EAF6FF', color: '#0078D4', border: '#7ACBFF' },
  ],
  [
    ['groq'],
    { iconModel: null, label: 'GQ', background: '#FFF1EC', color: '#F55036', border: '#FFB39F' },
  ],
  [
    ['together'],
    { iconModel: null, label: 'TG', background: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  ],
  [
    ['fireworks'],
    { iconModel: null, label: 'FW', background: '#FFF1F2', color: '#E11D48', border: '#FDA4AF' },
  ],
  [
    ['huggingface', 'hugging-face'],
    { iconModel: null, label: 'HF', background: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  ],
  [
    ['replicate'],
    { iconModel: null, label: 'RP', background: '#F8FAFC', color: '#334155', border: '#CBD5E1' },
  ],
  [
    ['voyage'],
    { iconModel: null, label: 'VO', background: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  ],
  [
    ['ai21'],
    { iconModel: null, label: '21', background: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  ],
]

const modelBrandMap: Array<[string[], ProviderBrandPreset]> = [
  [['gpt', 'o1', 'o3', 'o4', 'chatgpt', 'dall-e', 'whisper', 'tts-1', 'embedding', 'moderation', 'babbage', 'davinci', 'curie', 'ada'], providerBrandMap[0][1]],
  [['claude'], providerBrandMap[1][1]],
  [['gemini', 'gemma', 'imagen', 'veo'], providerBrandMap[2][1]],
  [['antigravity'], providerBrandMap[3][1]],
  [['deepseek'], providerBrandMap[4][1]],
  [['doubao'], providerBrandMap[5][1]],
  [['openrouter'], providerBrandMap[6][1]],
  [['mistral', 'mixtral', 'codestral'], providerBrandMap[7][1]],
  [['qwen', 'qwq'], providerBrandMap[8][1]],
  [['command', 'cohere'], providerBrandMap[9][1]],
  [['perplexity', 'pplx'], providerBrandMap[10][1]],
  [['moonshot', 'kimi'], providerBrandMap[11][1]],
  [['glm', 'chatglm'], providerBrandMap[12][1]],
  [['grok'], providerBrandMap[13][1]],
  [['llama'], providerBrandMap[16][1]],
  [['ernie', 'wenxin'], providerBrandMap[17][1]],
  [['spark'], providerBrandMap[18][1]],
  [['hunyuan'], providerBrandMap[19][1]],
  [['minimax', 'abab'], providerBrandMap[20][1]],
  [['jina'], providerBrandMap[21][1]],
  [['midjourney', 'mj_'], providerBrandMap[22][1]],
  [['suno'], providerBrandMap[23][1]],
  [['360'], providerBrandMap[24][1]],
  [['dify'], providerBrandMap[25][1]],
  [['coze'], providerBrandMap[26][1]],
]

function normalize(value?: string | null): string {
  return (value || '').trim().toLowerCase()
}

function findPreset(value: string, presets: Array<[string[], ProviderBrandPreset]>): ProviderBrandPreset | null {
  for (const [needles, preset] of presets) {
    if (needles.some((needle) => value.includes(needle))) return preset
  }
  return null
}

function findLogoPreset(value: string): AILogoPreset | null {
  if (!value) return null
  let source: (typeof aiLogoPresetSources)[number] | null = null
  let bestMatchLength = 0
  for (const preset of aiLogoPresetSources) {
    const keys = [preset.id, ...(preset.aliases ?? [])]
    const matchLength = keys.reduce((best, key) => (value.includes(key) ? Math.max(best, key.length) : best), 0)
    if (matchLength > bestMatchLength) {
      source = preset
      bestMatchLength = matchLength
    }
  }
  if (!source) return null
  return {
    id: source.id,
    label: source.label,
    url: aiLogoUrl(source.slug),
  }
}

function fallbackLabel(value: string): string {
  const parts = value.split(/[^a-z0-9]+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  const compact = parts[0] || value.replace(/[^a-z0-9]/g, '')
  return (compact.slice(0, 2) || '?').toUpperCase()
}

function fallbackPalette(value: string) {
  const seed = value || 'unknown'
  let hash = 0
  for (let idx = 0; idx < seed.length; idx += 1) {
    hash = (hash * 31 + seed.charCodeAt(idx)) % fallbackPalettes.length
  }
  return fallbackPalettes[hash]
}

function toInfo(preset: ProviderBrandPreset, labelSource: string): ProviderBrandInfo {
  return {
    label: preset.label || fallbackLabel(labelSource),
    iconModel: preset.iconModel,
    iconUrl: preset.iconUrl || findLogoPreset(labelSource)?.url,
    background: preset.background,
    color: preset.color,
    border: preset.border,
  }
}

export function aiLogoUrlForProvider(provider?: string | null, model?: string | null): string {
  const normalizedProvider = normalize(provider)
  const normalizedModel = normalize(model)
  const providerPreset = findPreset(normalizedProvider, providerBrandMap)
  const modelPreset = findPreset(normalizedModel, modelBrandMap)
  const iconModel = providerPreset?.iconModel || modelPreset?.iconModel || ''
  return (
    findLogoPreset(normalizedProvider)?.url ||
    findLogoPreset(normalizedModel)?.url ||
    findLogoPreset(normalize(iconModel))?.url ||
    ''
  )
}

export function providerBrandInfo(provider?: string | null, model?: string | null): ProviderBrandInfo {
  const normalizedProvider = normalize(provider)
  const normalizedModel = normalize(model)
  const providerPreset = findPreset(normalizedProvider, providerBrandMap)
  if (providerPreset) return toInfo(providerPreset, normalizedProvider)

  const modelPreset = findPreset(normalizedModel, modelBrandMap)
  if (modelPreset) {
    return toInfo(
      {
        ...modelPreset,
        iconModel: normalizedModel || modelPreset.iconModel,
        iconUrl: aiLogoUrlForProvider(normalizedProvider, normalizedModel),
      },
      normalizedModel,
    )
  }

  const labelSource = normalizedProvider || normalizedModel || 'unknown'
  const palette = fallbackPalette(labelSource)
  return {
    label: fallbackLabel(labelSource),
    iconModel: null,
    iconUrl: aiLogoUrlForProvider(normalizedProvider, normalizedModel),
    ...palette,
  }
}

export function providerBrandModel(provider?: string | null, model?: string | null): string {
  return providerBrandInfo(provider, model).iconModel || ''
}

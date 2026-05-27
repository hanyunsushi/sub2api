export interface ProviderBrandInfo {
  label: string
  iconModel: string | null
  background: string
  color: string
  border: string
}

type ProviderBrandPreset = Omit<ProviderBrandInfo, 'label'> & {
  label?: string
}

const fallbackPalettes = [
  { background: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  { background: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  { background: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  { background: '#FDF2F8', color: '#BE185D', border: '#FBCFE8' },
  { background: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
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
    { iconModel: 'gemini', label: 'G', background: '#EAF2FF', color: '#2563EB', border: '#B7D4FF' },
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
    { iconModel: 'ollama', label: 'OL', background: '#F8FAFC', color: '#334155', border: '#CBD5E1' },
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
    { iconModel: 'jina', label: 'JI', background: '#F8FAFC', color: '#334155', border: '#CBD5E1' },
  ],
  [
    ['midjourney'],
    { iconModel: 'midjourney', label: 'MJ', background: '#F8FAFC', color: '#334155', border: '#CBD5E1' },
  ],
  [
    ['suno'],
    { iconModel: 'suno', label: 'SU', background: '#F8FAFC', color: '#334155', border: '#CBD5E1' },
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
    background: preset.background,
    color: preset.color,
    border: preset.border,
  }
}

export function providerBrandInfo(provider?: string | null, model?: string | null): ProviderBrandInfo {
  const normalizedProvider = normalize(provider)
  const normalizedModel = normalize(model)
  const providerPreset = findPreset(normalizedProvider, providerBrandMap)
  if (providerPreset) return toInfo(providerPreset, normalizedProvider)

  const modelPreset = findPreset(normalizedModel, modelBrandMap)
  if (modelPreset) {
    return toInfo(
      { ...modelPreset, iconModel: normalizedModel || modelPreset.iconModel },
      normalizedModel,
    )
  }

  const labelSource = normalizedProvider || normalizedModel || 'unknown'
  const palette = fallbackPalette(labelSource)
  return {
    label: fallbackLabel(labelSource),
    iconModel: null,
    ...palette,
  }
}

export function providerBrandModel(provider?: string | null, model?: string | null): string {
  return providerBrandInfo(provider, model).iconModel || ''
}

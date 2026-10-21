import { afterEach, describe, expect, it, vi } from 'vitest'
import { consoleChartColors, consoleSeriesColors, consoleDistribution, consoleChartPlugins, consoleChartPlugin } from '../../styles/design-system/chart-style'
import type { Chart } from 'chart.js'
afterEach(()=>{ globalThis.__SUB2API_MICROFRONTEND__=undefined;vi.restoreAllMocks() })
describe('Shared AI first design system charts',()=>{
  it('shares fonts, colors and distribution behavior in standalone and Console without mutating input',()=>{
    const colors=['red','green'];const data={labels:['a'],datasets:[{data:[1],backgroundColor:colors}]}
    const original=JSON.stringify(data)
    expect(consoleSeriesColors(colors)).toEqual([...consoleChartColors])
    expect(consoleChartPlugins()).toEqual([consoleChartPlugin])
    const standalone=consoleDistribution(data,'其他')
    globalThis.__SUB2API_MICROFRONTEND__=true
    expect(consoleDistribution(data,'其他')).toEqual(standalone)
    expect(JSON.stringify(data)).toBe(original)
  })
  it('uses ordered distinct AWS series colors without replacing Apple status colors',()=>{
    globalThis.__SUB2API_MICROFRONTEND__=true
    expect(consoleSeriesColors(['red'])).toEqual([...consoleChartColors])
    expect(new Set(consoleChartColors).size).toBe(12)
    expect(consoleChartColors.slice(0,5)).toEqual(['#688ae8','#c33d69','#2ea597','#8456ce','#e07941'])
  })
  it('groups only chart long-tail values and preserves totals and the complete input table',()=>{
    globalThis.__SUB2API_MICROFRONTEND__=true
    const input={labels:Array.from({length:14},(_,i)=>'model-'+i),datasets:[{data:Array.from({length:14},(_,i)=>i+1),backgroundColor:['red']}]}
    const before=JSON.stringify(input),result=consoleDistribution(input,'其他')
    expect(result.labels).toEqual(['model-0','model-1','model-2','model-3','其他 (10)'])
    expect(result.datasets[0].data).toEqual([1,2,3,4,95])
    expect(result.datasets[0].backgroundColor).toHaveLength(5)
    expect(result.datasets[0].data.reduce((a,b)=>a+b,0)).toBe(105)
    expect(JSON.stringify(input)).toBe(before)
  })
  it('does not invent an Other segment for five or fewer categories or fill missing data',()=>{
    globalThis.__SUB2API_MICROFRONTEND__=true
    expect(consoleDistribution({labels:[],datasets:[{data:[]}]},'其他').datasets[0].data).toEqual([])
    const d=consoleDistribution({labels:['a','b'],datasets:[{data:[0,3]}]},'其他')
    expect(d.labels).toEqual(['a','b']);expect(d.datasets[0].data).toEqual([0,3])
  })
  it('honors live reduced motion and removes its media listener when the chart is destroyed',()=>{
    const add=vi.fn(),remove=vi.fn(),media={matches:true,addEventListener:add,removeEventListener:remove}
    vi.spyOn(window,'matchMedia').mockReturnValue(media as unknown as MediaQueryList)
    const rawAnimation={duration:700},resolvedAnimation=new Proxy({}, {})
    const chart={config:{options:{animation:rawAnimation}},options:{animation:resolvedAnimation,font:{size:11},plugins:{legend:{labels:{font:{size:11}}}},scales:{y:{ticks:{font:{size:10}},grid:{}}}},update:vi.fn()} as unknown as Chart
    consoleChartPlugin.beforeInit?.(chart,{} as never,{} as never)
    expect(chart.options.animation).toBe(false)
    consoleChartPlugin.beforeUpdate?.(chart,{} as never,{} as never)
    expect(chart.options.font?.family).toContain('Inter')
    media.matches=false;add.mock.calls[0][1]()
    expect(chart.options.animation).toEqual({duration:700})
    expect(chart.options.animation).toBe(rawAnimation)
    expect(chart.options.animation).not.toBe(resolvedAnimation)
    expect(chart.update).toHaveBeenCalledWith('none')
    consoleChartPlugin.afterDestroy?.(chart,{} as never,{} as never)
    expect(remove).toHaveBeenCalledWith('change',add.mock.calls[0][1])
  })
  it('restores default animation inheritance when no raw animation option was supplied',()=>{
    const add=vi.fn(),media={matches:true,addEventListener:add,removeEventListener:vi.fn()}
    vi.spyOn(window,'matchMedia').mockReturnValue(media as unknown as MediaQueryList)
    const chart={config:{options:{}},options:{animation:{}},update:vi.fn()} as unknown as Chart
    consoleChartPlugin.beforeInit?.(chart,{} as never,{} as never)
    expect(chart.options.animation).toBe(false)
    media.matches=false;add.mock.calls[0][1]()
    expect(chart.options.animation).toBeUndefined()
    consoleChartPlugin.afterDestroy?.(chart,{} as never,{} as never)
  })
})

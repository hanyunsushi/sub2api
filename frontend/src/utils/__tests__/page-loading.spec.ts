import { afterEach, describe, expect, it } from 'vitest'
import { beginPageLoad, cancelPageLoad, currentPageLoad, finishPageLoad, pageLoading, trackPageRequest, waitForPageRequests } from '../page-loading'
afterEach(() => cancelPageLoad())
describe('page readiness', () => {
  it('waits for the complete request before revealing', async () => {
    const token = beginPageLoad()
    let release!: () => void
    const request = trackPageRequest(() => new Promise<void>(resolve => { release = resolve }))
    let ready = false
    const waiting = waitForPageRequests(token).then(value => { ready = value })
    await new Promise(resolve => setTimeout(resolve, 60))
    expect(ready).toBe(false)
    expect(pageLoading.value).toBe(true)
    release(); await request; await waiting
    expect(ready).toBe(true)
    expect(finishPageLoad(token)).toBe(true)
  })
  it('isolates superseded responses and completion from the next route', async () => {
    const previous = beginPageLoad()
    let release!: () => void
    const old = trackPageRequest(() => new Promise<void>(resolve => { release = resolve }))
    const oldReady = waitForPageRequests(previous)
    const next = beginPageLoad()
    release(); await old
    expect(await oldReady).toBe(false)
    expect(finishPageLoad(previous)).toBe(false)
    expect(currentPageLoad()).toBe(next)
    expect(pageLoading.value).toBe(true)
    expect(await waitForPageRequests(next)).toBe(true)
  })
  it('settles failed requests without trapping the route', async () => {
    const token = beginPageLoad()
    await expect(trackPageRequest(async () => { throw Error('offline') })).rejects.toThrow('offline')
    expect(await waitForPageRequests(token)).toBe(true)
    expect(finishPageLoad(token)).toBe(true)
  })
})

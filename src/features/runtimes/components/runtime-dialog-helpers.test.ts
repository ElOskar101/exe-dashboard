import { describe, expect, it } from 'vitest'
import type {
  PlaywrightRuntime,
  PlaywrightRuntimeAccessInfo,
  PlaywrightRuntimeApplication,
  PlaywrightRuntimeSharedMember,
} from '@/features/executions'
import {
  getSharedMemberIdsFromMembers,
  getSharedMembers,
  toPlaywrightRuntimeAccessPayload,
  toPlaywrightRuntimeApplicationPayload,
} from './runtime-dialog-helpers'

const makeMember = (id: string, fullName = 'User'): PlaywrightRuntimeSharedMember => ({
  _id: id,
  fullName,
  username: `u${id}`,
  urlImage: `${id}.webp`,
})

const makeAccessInfo = (members: PlaywrightRuntimeSharedMember[]): PlaywrightRuntimeAccessInfo => ({
  type: 'private',
  sharedWith: members,
})

describe('runtime-dialog-helpers', () => {
  describe('getSharedMembers', () => {
    it('returns the sharedWith array reference', () => {
      const members = [makeMember('1'), makeMember('2')]
      const accessInfo = makeAccessInfo(members)

      expect(getSharedMembers(accessInfo)).toBe(members)
    })
  })

  describe('getSharedMemberIdsFromMembers', () => {
    it('maps members to their ids preserving order', () => {
      const members = [makeMember('a'), makeMember('b'), makeMember('c')]

      expect(getSharedMemberIdsFromMembers(members)).toEqual(['a', 'b', 'c'])
    })

    it('returns an empty array when there are no members', () => {
      expect(getSharedMemberIdsFromMembers([])).toEqual([])
    })
  })

  describe('toPlaywrightRuntimeAccessPayload', () => {
    it('projects members down to ids in sharedWith', () => {
      const accessInfo = makeAccessInfo([makeMember('1'), makeMember('2')])

      expect(toPlaywrightRuntimeAccessPayload(accessInfo)).toEqual({
        type: 'private',
        sharedWith: ['1', '2'],
      })
    })

    it('handles an empty sharedWith list', () => {
      const accessInfo = makeAccessInfo([])

      expect(toPlaywrightRuntimeAccessPayload(accessInfo)).toEqual({
        type: 'private',
        sharedWith: [],
      })
    })

    it('does not lose members when given a full PlaywrightRuntime', () => {
      const runtime = {
        accessInfo: makeAccessInfo([makeMember('x', 'Ada')]),
      } as PlaywrightRuntime

      expect(toPlaywrightRuntimeAccessPayload(runtime.accessInfo).sharedWith).toEqual(['x'])
    })
  })

  describe('toPlaywrightRuntimeApplicationPayload', () => {
    const makeApplication = (members: PlaywrightRuntimeSharedMember[]): PlaywrightRuntimeApplication =>
      ({
        name: 'app-1',
        active: true,
        nonProduction: false,
        accessInfo: makeAccessInfo(members),
        config: {},
      }) as PlaywrightRuntimeApplication

    it('projects shared members down to ids in accessInfo.sharedWith', () => {
      const runtime: PlaywrightRuntime = {
        _id: 'r1',
        name: 'runtime-1',
        accessInfo: makeAccessInfo([]),
      }
      const application = makeApplication([makeMember('1'), makeMember('2')])

      const payload = toPlaywrightRuntimeApplicationPayload(runtime, application)

      expect(payload.accessInfo.sharedWith).toEqual(['1', '2'])
    })

    it('preserves the private access type when the runtime is private', () => {
      const runtime: PlaywrightRuntime = {
        _id: 'r1',
        name: 'runtime-1',
        accessInfo: { type: 'private', sharedWith: [] },
      }
      const application: PlaywrightRuntimeApplication = {
        name: 'app-1',
        accessInfo: { type: 'public', sharedWith: [makeMember('1')] },
      }

      const payload = toPlaywrightRuntimeApplicationPayload(runtime, application)

      expect(payload.accessInfo.type).toBe('private')
      expect(payload.accessInfo.sharedWith).toEqual(['1'])
    })
  })
})

import { describe, expect, it } from 'vitest'
import type {
  PlaywrightRuntime,
  PlaywrightRuntimeAccessInfo,
  PlaywrightRuntimeApplication,
  PlaywrightRuntimeSharedMember,
} from '@/features/executions'
import {
  getPlaywrightRuntimeCreatorLabel,
  getSharedMemberIdsFromMembers,
  getSharedMembers,
  isPlaywrightRuntimeOwner,
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

const makeRuntime = (createdBy: string, type: PlaywrightRuntime['accessInfo']['type']): PlaywrightRuntime => ({
  _id: 'runtime-1',
  name: 'Runtime 1',
  accessInfo: {
    createdBy: {
      _id: createdBy,
      fullName: 'Runtime Creator',
    },
    sharedWith: [],
    type,
  },
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

  describe('getPlaywrightRuntimeCreatorLabel', () => {
    it('prefers the creator full name', () => {
      expect(
        getPlaywrightRuntimeCreatorLabel({
          _id: 'user-1',
          fullName: 'Ada Lovelace',
          username: 'adal',
        }),
      ).toBe('Ada Lovelace')
    })

    it('falls back to username and then id', () => {
      expect(getPlaywrightRuntimeCreatorLabel({ _id: 'user-1', username: 'adal' })).toBe('adal')
      expect(getPlaywrightRuntimeCreatorLabel({ _id: 'user-1' })).toBe('user-1')
    })
  })

  describe('toPlaywrightRuntimeAccessPayload', () => {
    it('keeps runtime sharing out of normal runtime update payloads', () => {
      const accessInfo = makeAccessInfo([makeMember('1'), makeMember('2')])

      expect(toPlaywrightRuntimeAccessPayload(accessInfo)).toEqual({
        type: 'private',
      })
    })

    it('preserves the runtime access type', () => {
      const accessInfo = makeAccessInfo([])

      expect(toPlaywrightRuntimeAccessPayload(accessInfo)).toEqual({
        type: 'private',
      })
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

  describe('isPlaywrightRuntimeOwner', () => {
    it('returns true when the current user created the runtime', () => {
      const runtime = makeRuntime('user-1', 'private')

      expect(isPlaywrightRuntimeOwner(runtime, 'user-1')).toBe(true)
    })

    it('returns false when the runtime has a different owner', () => {
      const runtime = makeRuntime('user-2', 'public')

      expect(isPlaywrightRuntimeOwner(runtime, 'user-1')).toBe(false)
    })

    it('returns false without a current user id', () => {
      const runtime = makeRuntime('user-1', 'private')

      expect(isPlaywrightRuntimeOwner(runtime, undefined)).toBe(false)
    })
  })
})

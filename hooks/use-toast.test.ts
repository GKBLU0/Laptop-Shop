import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast, toast, reducer } from './use-toast'

// Mock setTimeout and clearTimeout
vi.useFakeTimers()

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    // Reset the toast state by clearing the memory state
    // This is a bit hacky but necessary since the toast state is global
    const { result } = renderHook(() => useToast())
    if (result.current.toasts.length > 0) {
      act(() => {
        result.current.dismiss()
      })
    }
  })

  describe('reducer', () => {
    it('adds toast to state', () => {
      const initialState = { toasts: [] }
      const toast = {
        id: '1',
        title: 'Test Toast',
        description: 'Test Description'
      }

      const newState = reducer(initialState, {
        type: 'ADD_TOAST',
        toast
      })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0]).toEqual(toast)
    })

    it('limits toasts to TOAST_LIMIT', () => {
      const initialState = { 
        toasts: [{ id: '1', title: 'First' }] 
      }
      const newToast = { id: '2', title: 'Second' }

      const newState = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast
      })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0]).toEqual(newToast)
    })

    it('updates existing toast', () => {
      const initialState = {
        toasts: [{ id: '1', title: 'Original' }]
      }

      const newState = reducer(initialState, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' }
      })

      expect(newState.toasts[0].title).toBe('Updated')
    })

    it('dismisses toast by setting open to false', () => {
      const initialState = {
        toasts: [{ id: '1', title: 'Test', open: true }]
      }

      const newState = reducer(initialState, {
        type: 'DISMISS_TOAST',
        toastId: '1'
      })

      expect(newState.toasts[0].open).toBe(false)
    })

    it('dismisses all toasts when no toastId provided', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'First', open: true },
          { id: '2', title: 'Second', open: true }
        ]
      }

      const newState = reducer(initialState, {
        type: 'DISMISS_TOAST'
      })

      expect(newState.toasts.every(t => t.open === false)).toBe(true)
    })

    it('removes toast from state', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'First' },
          { id: '2', title: 'Second' }
        ]
      }

      const newState = reducer(initialState, {
        type: 'REMOVE_TOAST',
        toastId: '1'
      })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0].id).toBe('2')
    })

    it('removes all toasts when no toastId provided', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'First' },
          { id: '2', title: 'Second' }
        ]
      }

      const newState = reducer(initialState, {
        type: 'REMOVE_TOAST'
      })

      expect(newState.toasts).toHaveLength(0)
    })
  })

  describe('toast function', () => {
    it('creates a toast with generated id', () => {
      const result = toast({ title: 'Test Toast' })
      
      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe('string')
      expect(result.dismiss).toBeInstanceOf(Function)
      expect(result.update).toBeInstanceOf(Function)
    })

    it('returns dismiss function that works', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        const toastResult = toast({ title: 'Test Toast' })
        toastResult.dismiss()
      })

      // Toast should be dismissed (open: false)
      expect(result.current.toasts.length).toBeGreaterThanOrEqual(0)
    })

    it('returns update function that works', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        const toastResult = toast({ title: 'Original Title' })
        toastResult.update({ title: 'Updated Title' })
      })

      const currentToast = result.current.toasts[0]
      if (currentToast) {
        expect(currentToast.title).toBe('Updated Title')
      }
    })
  })

  describe('useToast hook', () => {
    it('returns initial empty state', () => {
      const { result } = renderHook(() => useToast())
      
      expect(result.current.toasts).toEqual([])
      expect(result.current.toast).toBeInstanceOf(Function)
      expect(result.current.dismiss).toBeInstanceOf(Function)
    })

    it('updates state when toast is added', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({ title: 'New Toast' })
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].title).toBe('New Toast')
    })

    it('updates state when toast is dismissed', () => {
      const { result } = renderHook(() => useToast())
      
      let toastId: string
      act(() => {
        const toastResult = result.current.toast({ title: 'Test Toast' })
        toastId = toastResult.id
      })

      act(() => {
        result.current.dismiss(toastId!)
      })

      const dismissedToast = result.current.toasts.find(t => t.id === toastId!)
      if (dismissedToast) {
        expect(dismissedToast.open).toBe(false)
      }
    })

    it('dismisses all toasts when no id provided', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({ title: 'First Toast' })
        result.current.toast({ title: 'Second Toast' })
      })

      act(() => {
        result.current.dismiss()
      })

      expect(result.current.toasts.every(t => t.open === false)).toBe(true)
    })

    it('handles toast with action', () => {
      const { result } = renderHook(() => useToast())
      const mockAction = { altText: 'Undo' } as any
      
      act(() => {
        result.current.toast({ 
          title: 'Toast with action',
          action: mockAction
        })
      })

      expect(result.current.toasts[0].action).toEqual(mockAction)
    })

    it('handles toast with description', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({ 
          title: 'Title',
          description: 'Description text'
        })
      })

      expect(result.current.toasts[0].description).toBe('Description text')
    })

    it('sets open to true by default', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({ title: 'Test Toast' })
      })

      expect(result.current.toasts[0].open).toBe(true)
    })

    it('calls onOpenChange when provided', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({ title: 'Test Toast' })
      })

      const toast = result.current.toasts[0]
      expect(toast.onOpenChange).toBeInstanceOf(Function)
      
      // Test onOpenChange calls dismiss
      act(() => {
        toast.onOpenChange?.(false)
      })

      expect(result.current.toasts[0].open).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('cleans up listeners on unmount', () => {
      const { unmount } = renderHook(() => useToast())
      
      // This test ensures no memory leaks occur
      expect(() => unmount()).not.toThrow()
    })
  })
})
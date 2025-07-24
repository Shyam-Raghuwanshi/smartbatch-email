import React, { useEffect, useCallback, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  meta?: boolean
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  action: () => void
  description: string
  category?: string
}

interface KeyboardShortcutsContextType {
  registerShortcut: (shortcut: KeyboardShortcut) => void
  unregisterShortcut: (key: string) => void
  getShortcuts: () => KeyboardShortcut[]
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined)

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider')
  }
  return context
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
}

export const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProviderProps> = ({ children }) => {
  const [shortcuts, setShortcuts] = React.useState<Map<string, KeyboardShortcut>>(new Map())
  const router = useRouter()

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => new Map(prev.set(shortcut.key, shortcut)))
  }, [])

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }, [])

  const getShortcuts = useCallback(() => {
    return Array.from(shortcuts.values())
  }, [shortcuts])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when user is typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return
    }

    for (const shortcut of shortcuts.values()) {
      const isMatch = 
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        (!shortcut.meta || event.metaKey) &&
        (!shortcut.ctrl || event.ctrlKey) &&
        (!shortcut.alt || event.altKey) &&
        (!shortcut.shift || event.shiftKey)

      if (isMatch) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Register default application shortcuts
  useEffect(() => {
    const defaultShortcuts: KeyboardShortcut[] = [
      {
        key: '/',
        action: () => {
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          }
        },
        description: 'Focus search',
        category: 'Navigation'
      },
      {
        key: 'h',
        action: () => router.push('/dashboard'),
        description: 'Go to dashboard',
        category: 'Navigation'
      },
      {
        key: 'c',
        action: () => router.push('/dashboard/contacts'),
        description: 'Go to contacts',
        category: 'Navigation'
      },
      {
        key: 'e',
        action: () => router.push('/dashboard/campaigns'),
        description: 'Go to campaigns',
        category: 'Navigation'
      },
      {
        key: 'g',
        action: () => router.push('/dashboard/gdpr'),
        description: 'Go to GDPR dashboard',
        category: 'Navigation'
      },
      {
        key: 'n',
        alt: true,
        action: () => {
          const newButton = document.querySelector('[data-new-button]') as HTMLButtonElement
          if (newButton) {
            newButton.click()
          }
        },
        description: 'New item',
        category: 'Actions'
      },
      {
        key: 's',
        meta: true,
        action: () => {
          const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement
          if (saveButton) {
            saveButton.click()
          }
        },
        description: 'Save',
        category: 'Actions'
      },
      {
        key: 'k',
        meta: true,
        action: () => {
          // Open command palette (if implemented)
          const commandPalette = document.querySelector('[data-command-palette]') as HTMLElement
          if (commandPalette) {
            commandPalette.click()
          }
        },
        description: 'Open command palette',
        category: 'Navigation'
      },
      {
        key: '?',
        shift: true,
        action: () => {
          // Show keyboard shortcuts help
          const helpModal = document.querySelector('[data-help-modal]') as HTMLElement
          if (helpModal) {
            helpModal.click()
          }
        },
        description: 'Show keyboard shortcuts',
        category: 'Help'
      }
    ]

    defaultShortcuts.forEach(registerShortcut)

    return () => {
      defaultShortcuts.forEach(shortcut => unregisterShortcut(shortcut.key))
    }
  }, [registerShortcut, unregisterShortcut, router])

  const value = {
    registerShortcut,
    unregisterShortcut,
    getShortcuts
  }

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}

// Custom hook for component-specific shortcuts
export const useComponentShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts()

  useEffect(() => {
    shortcuts.forEach(registerShortcut)
    
    return () => {
      shortcuts.forEach(shortcut => unregisterShortcut(shortcut.key))
    }
  }, [shortcuts, registerShortcut, unregisterShortcut])
}

// Keyboard shortcuts help modal component
export const KeyboardShortcutsHelp: React.FC<{ 
  isOpen: boolean
  onClose: () => void 
}> = ({ isOpen, onClose }) => {
  const { getShortcuts } = useKeyboardShortcuts()
  const shortcuts = getShortcuts()

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  const formatKey = (shortcut: KeyboardShortcut) => {
    const keys = []
    if (shortcut.meta) keys.push('⌘')
    if (shortcut.ctrl) keys.push('Ctrl')
    if (shortcut.alt) keys.push('Alt')
    if (shortcut.shift) keys.push('⇧')
    keys.push(shortcut.key.toUpperCase())
    return keys.join(' + ')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded border text-sm font-mono">
                      {formatKey(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> to close this dialog
          </p>
        </div>
      </div>
    </div>
  )
}

// Hook to show keyboard shortcuts help
export const useKeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = React.useState(false)

  const openHelp = useCallback(() => setIsOpen(true), [])
  const closeHelp = useCallback(() => setIsOpen(false), [])

  // Register the help shortcut
  useComponentShortcuts([
    {
      key: 'Escape',
      action: closeHelp,
      description: 'Close modal',
      category: 'Modal'
    }
  ])

  return {
    isOpen,
    openHelp,
    closeHelp,
    HelpModal: () => <KeyboardShortcutsHelp isOpen={isOpen} onClose={closeHelp} />
  }
}

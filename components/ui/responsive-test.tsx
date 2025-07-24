import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react'

interface ViewportSize {
  width: number
  height: number
  name: string
  icon: React.ComponentType<any>
}

const VIEWPORT_SIZES: ViewportSize[] = [
  { width: 375, height: 667, name: 'iPhone SE', icon: Smartphone },
  { width: 414, height: 896, name: 'iPhone 11', icon: Smartphone },
  { width: 768, height: 1024, name: 'iPad', icon: Tablet },
  { width: 1024, height: 768, name: 'iPad Landscape', icon: Tablet },
  { width: 1280, height: 720, name: 'Desktop Small', icon: Monitor },
  { width: 1920, height: 1080, name: 'Desktop Large', icon: Monitor },
]

interface ResponsiveTestProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export const ResponsiveTest: React.FC<ResponsiveTestProps> = ({
  isOpen,
  onClose,
  children
}) => {
  const [selectedViewport, setSelectedViewport] = useState<ViewportSize>(VIEWPORT_SIZES[0])
  const [isLandscape, setIsLandscape] = useState(false)
  const [zoom, setZoom] = useState(1)

  const currentWidth = isLandscape ? selectedViewport.height : selectedViewport.width
  const currentHeight = isLandscape ? selectedViewport.width : selectedViewport.height

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Responsive Design Testing</h2>
          
          <div className="flex items-center space-x-4">
            {/* Viewport Selection */}
            <select
              value={VIEWPORT_SIZES.indexOf(selectedViewport)}
              onChange={(e) => setSelectedViewport(VIEWPORT_SIZES[parseInt(e.target.value)])}
              className="border rounded px-3 py-1"
            >
              {VIEWPORT_SIZES.map((viewport, index) => (
                <option key={index} value={index}>
                  {viewport.name} ({viewport.width}×{viewport.height})
                </option>
              ))}
            </select>

            {/* Orientation Toggle */}
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              className="p-2 border rounded hover:bg-gray-50"
              title="Toggle orientation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Zoom Control */}
            <div className="flex items-center space-x-2">
              <span className="text-sm">Zoom:</span>
              <input
                type="range"
                min="0.25"
                max="2"
                step="0.25"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-sm w-12">{Math.round(zoom * 100)}%</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Viewport Info */}
        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-b">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <selectedViewport.icon className="w-4 h-4" />
              <span>{selectedViewport.name}</span>
            </span>
            <span>{currentWidth}×{currentHeight}px</span>
            <span>{isLandscape ? 'Landscape' : 'Portrait'}</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Viewport Container */}
        <div className="flex-1 p-8 bg-gray-100 overflow-auto">
          <div className="flex justify-center">
            <div
              className="bg-white shadow-lg rounded-lg overflow-hidden"
              style={{
                width: currentWidth * zoom,
                height: currentHeight * zoom,
                transform: `scale(${zoom})`,
                transformOrigin: 'top center'
              }}
            >
              <div
                className="w-full h-full overflow-auto"
                style={{
                  width: currentWidth,
                  height: currentHeight
                }}
              >
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Guidelines */}
        <div className="p-4 border-t bg-gray-50">
          <ResponsiveGuidelines currentViewport={selectedViewport} />
        </div>
      </div>
    </div>
  )
}

const ResponsiveGuidelines: React.FC<{ currentViewport: ViewportSize }> = ({
  currentViewport
}) => {
  const getGuidelines = () => {
    if (currentViewport.width < 768) {
      return [
        'Touch targets should be at least 44px',
        'Navigation should be collapsible',
        'Content should stack vertically',
        'Text should be readable without zooming'
      ]
    } else if (currentViewport.width < 1024) {
      return [
        'Consider tablet-specific layouts',
        'Utilize available screen space',
        'Maintain touch-friendly interactions',
        'Test both orientations'
      ]
    } else {
      return [
        'Utilize horizontal space effectively',
        'Consider multiple columns',
        'Optimize for mouse interactions',
        'Ensure content doesn\'t feel cramped'
      ]
    }
  }

  return (
    <div>
      <h4 className="font-medium text-sm mb-2">Guidelines for {currentViewport.name}:</h4>
      <ul className="text-xs text-gray-600 space-y-1">
        {getGuidelines().map((guideline, index) => (
          <li key={index} className="flex items-start space-x-2">
            <span className="text-blue-500">•</span>
            <span>{guideline}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Hook for responsive testing
export const useResponsiveTest = () => {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return {
    isOpen,
    open,
    close,
    ResponsiveTestModal: ({ children }: { children: React.ReactNode }) => (
      <ResponsiveTest isOpen={isOpen} onClose={close}>
        {children}
      </ResponsiveTest>
    )
  }
}

// Component to detect current screen size
export const ScreenSizeIndicator: React.FC = () => {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const getBreakpoint = (width: number) => {
    if (width < 640) return 'xs'
    if (width < 768) return 'sm'
    if (width < 1024) return 'md'
    if (width < 1280) return 'lg'
    return 'xl'
  }

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white px-2 py-1 rounded text-xs font-mono z-50">
      {screenSize.width}×{screenSize.height} ({getBreakpoint(screenSize.width)})
    </div>
  )
}

// Responsive grid helper component
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn(
      'grid gap-4',
      'grid-cols-1', // Mobile first
      'sm:grid-cols-2', // Small screens (tablets)
      'lg:grid-cols-3', // Large screens (desktop)
      'xl:grid-cols-4', // Extra large screens
      className
    )}>
      {children}
    </div>
  )
}

// Component to test GDPR form responsiveness
export const GDPRFormResponsiveTest: React.FC = () => {
  const { ResponsiveTestModal, open, isOpen } = useResponsiveTest()

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <>
      <button
        onClick={open}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        Test Responsive
      </button>

      <ResponsiveTestModal>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">GDPR Compliance Dashboard</h1>
          
          <ResponsiveGrid>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold">Consent Stats</h3>
              <p className="text-2xl font-bold">85%</p>
              <p className="text-sm text-gray-600">Active consents</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold">Requests</h3>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold">Compliance Score</h3>
              <p className="text-2xl font-bold">92</p>
              <p className="text-sm text-gray-600">Out of 100</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold">Audit Logs</h3>
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
          </ResponsiveGrid>

          <div className="mt-6 space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Recent Data Requests</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">user@example.com</td>
                      <td className="py-2">Access</td>
                      <td className="py-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                          Pending
                        </span>
                      </td>
                      <td className="py-2">2024-01-15</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveTestModal>
    </>
  )
}

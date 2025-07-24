import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Smartphone, Tablet, Monitor, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'full'

interface ViewportConfig {
  width: number
  height: number
  name: string
  icon: React.ReactNode
}

const viewportConfigs: Record<ViewportSize, ViewportConfig> = {
  mobile: {
    width: 375,
    height: 667,
    name: 'Mobile',
    icon: <Smartphone className="w-4 h-4" />
  },
  tablet: {
    width: 768,
    height: 1024,
    name: 'Tablet',
    icon: <Tablet className="w-4 h-4" />
  },
  desktop: {
    width: 1440,
    height: 900,
    name: 'Desktop',
    icon: <Monitor className="w-4 h-4" />
  },
  full: {
    width: window?.innerWidth || 1920,
    height: window?.innerHeight || 1080,
    name: 'Full Screen',
    icon: <Eye className="w-4 h-4" />
  }
}

interface ResponsiveTestingProps {
  children: React.ReactNode
  className?: string
}

export const ResponsiveTesting: React.FC<ResponsiveTestingProps> = ({
  children,
  className
}) => {
  const [currentViewport, setCurrentViewport] = useState<ViewportSize>('full')
  const [isTestingMode, setIsTestingMode] = useState(false)

  const config = viewportConfigs[currentViewport]

  useEffect(() => {
    // Listen for keyboard shortcut to toggle testing mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' && e.altKey && e.shiftKey) {
        e.preventDefault()
        setIsTestingMode(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isTestingMode) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Responsive Testing Mode
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTestingMode(false)}
            >
              Exit Testing
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(viewportConfigs) as ViewportSize[]).map((viewport) => (
              <Button
                key={viewport}
                variant={currentViewport === viewport ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentViewport(viewport)}
                className="flex items-center gap-2"
              >
                {viewportConfigs[viewport].icon}
                {viewportConfigs[viewport].name}
                <span className="text-xs opacity-70">
                  {viewport !== 'full' && 
                    `${viewportConfigs[viewport].width}×${viewportConfigs[viewport].height}`
                  }
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <div
          className={cn(
            "bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300",
            currentViewport === 'full' ? "w-full" : "",
            className
          )}
          style={
            currentViewport !== 'full'
              ? {
                  width: config.width,
                  height: config.height,
                  minHeight: config.height,
                }
              : {}
          }
        >
          <div className="w-full h-full overflow-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Viewport info overlay */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        {config.name}: {currentViewport !== 'full' && `${config.width}×${config.height}`}
        {currentViewport === 'full' && `${window.innerWidth}×${window.innerHeight}`}
      </div>
    </div>
  )
}

// Hook for responsive behavior testing
export const useResponsiveTest = () => {
  const [screenSize, setScreenSize] = useState<ViewportSize>('desktop')

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return {
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
  }
}

// Component for testing touch interactions on mobile
export const TouchTestingOverlay: React.FC = () => {
  const [touches, setTouches] = useState<{ x: number; y: number; id: number }[]>([])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const newTouches = Array.from(e.touches).map((touch, index) => ({
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier
      }))
      setTouches(newTouches)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const newTouches = Array.from(e.touches).map((touch, index) => ({
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier
      }))
      setTouches(newTouches)
    }

    const handleTouchEnd = () => {
      setTouches([])
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <>
      {touches.map((touch) => (
        <div
          key={touch.id}
          className="fixed w-12 h-12 bg-blue-500/30 border-2 border-blue-500 rounded-full pointer-events-none z-50"
          style={{
            left: touch.x - 24,
            top: touch.y - 24,
            transform: 'scale(1)',
            animation: 'ping 0.3s ease-out'
          }}
        />
      ))}
    </>
  )
}

// Accessibility testing helper
export const AccessibilityTester: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHighContrastMode, setIsHighContrastMode] = useState(false)
  const [fontSize, setFontSize] = useState(16)

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  useEffect(() => {
    if (isHighContrastMode) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [isHighContrastMode])

  return (
    <div className="relative">
      {/* Accessibility controls */}
      <div className="fixed top-4 left-4 bg-white border rounded-lg p-3 shadow-lg z-50 space-y-2">
        <h3 className="font-semibold text-sm">Accessibility Testing</h3>
        
        <div className="flex items-center gap-2">
          <label htmlFor="contrast-toggle" className="text-xs">
            High Contrast:
          </label>
          <input
            id="contrast-toggle"
            type="checkbox"
            checked={isHighContrastMode}
            onChange={(e) => setIsHighContrastMode(e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="font-size" className="text-xs">
            Font Size:
          </label>
          <input
            id="font-size"
            type="range"
            min="12"
            max="24"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-xs">{fontSize}px</span>
        </div>
      </div>

      {children}
    </div>
  )
}

// Performance monitoring component
export const PerformanceMonitor: React.FC = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    fps: number
    memoryUsage: number
    loadTime: number
  }>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0
  })

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime

        setPerformanceMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
          loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0
        }))
      }

      requestAnimationFrame(measureFPS)
    }

    measureFPS()
  }, [])

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs space-y-1">
      <div>FPS: {performanceMetrics.fps}</div>
      <div>Memory: {performanceMetrics.memoryUsage.toFixed(1)} MB</div>
      <div>Load: {performanceMetrics.loadTime}ms</div>
    </div>
  )
}

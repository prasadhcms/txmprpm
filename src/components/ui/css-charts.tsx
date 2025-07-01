import { cn } from '@/lib/utils'

// Types for chart data
interface BarChartData {
  name: string
  value: number
  color?: string
}

interface PieChartData {
  name: string
  value: number
  color: string
}

interface ProgressData {
  label: string
  value: number
  total: number
  color: string
}

// CSS Bar Chart Component
interface CSSBarChartProps {
  data: BarChartData[]
  height?: number
  className?: string
  showValues?: boolean
  showLabels?: boolean
}

export function CSSBarChart({ 
  data, 
  height = 300, 
  className,
  showValues = true,
  showLabels = true 
}: CSSBarChartProps) {
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2 px-4 pb-8">
        {data.map((item, index) => {
          const heightPercentage = (item.value / maxValue) * 100
          const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`
          
          return (
            <div key={item.name} className="flex flex-col items-center flex-1 max-w-[80px]">
              {/* Bar */}
              <div className="relative w-full flex flex-col justify-end" style={{ height: height - 60 }}>
                {showValues && (
                  <div className="text-xs font-medium text-center mb-1 text-muted-foreground">
                    {item.value}
                  </div>
                )}
                <div
                  className="w-full rounded-t-md transition-all duration-700 ease-out shadow-sm"
                  style={{
                    height: `${heightPercentage}%`,
                    backgroundColor: color,
                    minHeight: '4px'
                  }}
                />
              </div>
              
              {/* Label */}
              {showLabels && (
                <div className="text-xs text-center mt-2 text-muted-foreground font-medium leading-tight">
                  {item.name.length > 8 ? `${item.name.slice(0, 8)}...` : item.name}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// CSS Pie Chart Component (using CSS conic-gradient)
interface CSSPieChartProps {
  data: PieChartData[]
  size?: number
  className?: string
  showLabels?: boolean
  showLegend?: boolean
}

export function CSSPieChart({ 
  data, 
  size = 200, 
  className,
  showLegend = true 
}: CSSPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  // Calculate percentages and create conic-gradient
  let currentPercentage = 0
  const gradientStops = data.map(item => {
    const percentage = (item.value / total) * 100
    const start = currentPercentage
    const end = currentPercentage + percentage
    currentPercentage = end
    
    return `${item.color} ${start}% ${end}%`
  }).join(', ')
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Pie Chart */}
      <div className="relative">
        <div
          className="rounded-full shadow-lg"
          style={{
            width: size,
            height: size,
            background: `conic-gradient(${gradientStops})`
          }}
        />
        
        {/* Center hole for donut effect */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background rounded-full shadow-inner"
          style={{
            width: size * 0.6,
            height: size * 0.6
          }}
        />
        
        {/* Center text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-2xl font-bold text-foreground">{total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="mt-4 grid grid-cols-1 gap-2 w-full max-w-xs">
          {data.map((item) => {
            const percentage = ((item.value / total) * 100).toFixed(1)
            return (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.value}</span>
                  <span className="text-xs text-muted-foreground">({percentage}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// CSS Progress Ring Component
interface CSSProgressRingProps {
  data: ProgressData[]
  size?: number
  className?: string
  strokeWidth?: number
}

export function CSSProgressRing({ 
  data, 
  size = 120, 
  className,
  strokeWidth = 8 
}: CSSProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  
  return (
    <div className={cn("grid gap-4", className)}>
      {data.map((item) => {
        const percentage = (item.value / item.total) * 100
        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
        
        return (
          <div key={item.label} className="flex items-center gap-4">
            {/* Progress Ring */}
            <div className="relative" style={{ width: size, height: size }}>
              <svg
                className="transform -rotate-90"
                width={size}
                height={size}
              >
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold">{percentage.toFixed(0)}%</div>
                </div>
              </div>
            </div>
            
            {/* Label and values */}
            <div className="flex-1">
              <div className="font-medium text-foreground">{item.label}</div>
              <div className="text-sm text-muted-foreground">
                {item.value} of {item.total}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Simple Progress Bar Component
interface CSSProgressBarProps {
  data: ProgressData[]
  className?: string
  height?: number
}

export function CSSProgressBar({ 
  data, 
  className,
  height = 8 
}: CSSProgressBarProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {data.map((item) => {
        const percentage = (item.value / item.total) * 100
        
        return (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="text-sm text-muted-foreground">
                {item.value}/{item.total} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full" style={{ height }}>
              <div
                className="rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${percentage}%`,
                  height,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Horizontal Bar Chart Component
interface CSSHorizontalBarProps {
  data: BarChartData[]
  className?: string
  height?: number
}

export function CSSHorizontalBar({ 
  data, 
  className,
  height = 40 
}: CSSHorizontalBarProps) {
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => {
        const widthPercentage = (item.value / maxValue) * 100
        const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`
        
        return (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <span className="text-sm text-muted-foreground">{item.value}</span>
            </div>
            <div className="w-full bg-muted rounded-full" style={{ height }}>
              <div
                className="rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${widthPercentage}%`,
                  height,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
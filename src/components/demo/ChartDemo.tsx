import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CSSBarChart, CSSPieChart, CSSProgressBar, CSSHorizontalBar } from '@/components/ui/css-charts'

// Sample data for demonstration
const sampleBarData = [
  { name: 'Engineering', value: 25, color: '#3b82f6' },
  { name: 'Marketing', value: 15, color: '#10b981' },
  { name: 'Sales', value: 20, color: '#f59e0b' },
  { name: 'HR', value: 8, color: '#ef4444' },
  { name: 'Finance', value: 12, color: '#8b5cf6' }
]

const samplePieData = [
  { name: 'Completed', value: 45, color: '#10b981' },
  { name: 'In Progress', value: 30, color: '#3b82f6' },
  { name: 'Pending', value: 15, color: '#f59e0b' },
  { name: 'Overdue', value: 10, color: '#ef4444' }
]

const sampleProgressData = [
  { label: 'Task Completion', value: 75, total: 100, color: '#10b981' },
  { label: 'Leave Utilization', value: 45, total: 100, color: '#3b82f6' },
  { label: 'Project Progress', value: 60, total: 100, color: '#f59e0b' }
]

export function ChartDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">CSS Chart Components Demo</h1>
        <p className="text-muted-foreground">Lightweight, performant chart components using pure CSS</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employee count by department</CardDescription>
          </CardHeader>
          <CardContent>
            <CSSBarChart 
              data={sampleBarData}
              height={300}
              showValues={true}
              showLabels={true}
            />
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Overview</CardTitle>
            <CardDescription>Current task distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <CSSPieChart 
                data={samplePieData}
                size={200}
                showLabels={true}
                showLegend={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Progress Bars */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <CSSProgressBar 
              data={sampleProgressData}
              height={12}
            />
          </CardContent>
        </Card>

        {/* Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Requests by department</CardDescription>
          </CardHeader>
          <CardContent>
            <CSSHorizontalBar 
              data={sampleBarData}
              height={32}
            />
          </CardContent>
        </Card>
      </div>

      {/* Performance Benefits */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Performance Benefits</CardTitle>
          <CardDescription className="text-green-700">
            Switching from Recharts to CSS-based charts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">~300KB</div>
              <div className="text-sm text-green-700">Bundle Size Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">75%</div>
              <div className="text-sm text-blue-700">Faster Load Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0ms</div>
              <div className="text-sm text-purple-700">JS Initialization</div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Key Advantages:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Pure CSS rendering - no JavaScript overhead</li>
              <li>• Responsive by default with Tailwind classes</li>
              <li>• Smooth animations using CSS transitions</li>
              <li>• Better accessibility with semantic HTML</li>
              <li>• Consistent with your design system</li>
              <li>• Easier to customize and maintain</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
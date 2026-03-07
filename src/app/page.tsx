import { Hero } from '@/components/hero'
import { Stats } from '@/components/stats'
import { TaskFeed } from '@/components/task-feed'

export default function Home() {
  return (
    <main>
      <Hero />
      <Stats />
      <TaskFeed />
    </main>
  )
}

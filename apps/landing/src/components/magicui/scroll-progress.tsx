import { motion, useScroll, useSpring } from 'motion/react'
import { cn } from '@/lib/utils'

export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  })
  return (
    <motion.div
      className={cn(
        'fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-linear-to-r from-primary via-primary to-primary/40',
        className,
      )}
      style={{ scaleX }}
    />
  )
}

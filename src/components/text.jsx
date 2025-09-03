import * as React from "react"
import { cn } from "@/utilities/utils"

const Text = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <p
      className={cn(className)}
      ref={ref}
      {...props}
    />
  )
})
Text.displayName = "Text"

export { Text } 
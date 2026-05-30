import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // src/demo/** is the BurnRate app's source, ported verbatim and adapted only at
  // the platform boundary. It follows the desktop app's lint conventions, not this
  // site's, so we lint our own code here and leave the ported tree to TypeScript
  // (which still type-checks the whole project during the build).
  eslint: { dirs: ['src/app', 'src/components', 'src/lib'] },
}

export default nextConfig

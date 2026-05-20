import { Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <div className={`h-full w-full ${className ?? ''}`}>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
          </div>
        }
      >
        <Spline scene={scene} style={{ width: '100%', height: '100%' }} />
      </Suspense>
    </div>
  );
}

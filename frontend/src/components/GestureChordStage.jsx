import { useMemo, useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Hand, Lock, Music, Sparkles, VideoOff, Volume2 } from 'lucide-react';
import * as Tone from 'tone';
import useHandTracking from '../hooks/useHandTracking';
import useChordSynth from '../hooks/useChordSynth';

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z',
  ].join(' ');
}

export default function GestureChordStage({ chords = [] }) {
  const { videoRef, landmarks, isReady, error, start, isPinching, isFist } =
    useHandTracking();
  const { playChord, stopChord, setShimmer } = useChordSynth();

  const [audioStarted, setAudioStarted] = useState(false);
  const [activeChord, setActiveChord] = useState(null);

  // Hysteresis refs
  const pendingSegmentRef = useRef(null);
  const pendingCountRef = useRef(0);

  // Dedupe and select top 8 unique chords by total duration
  const uniqueChords = useMemo(() => {
    if (!Array.isArray(chords) || chords.length === 0) return [];

    const durationMap = new Map();
    chords.forEach((c) => {
      if (!c.chord || c.chord === 'N.C.') return;
      const duration = (c.end_time || 0) - (c.start_time || 0);
      durationMap.set(c.chord, (durationMap.get(c.chord) || 0) + duration);
    });

    const entries = Array.from(durationMap.entries());
    if (entries.length === 0) return [];

    // Sort by duration descending
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 8).map(([chord]) => chord);
  }, [chords]);

  const count = uniqueChords.length;

  // Handle Shimmer gesture
  useEffect(() => {
    if (audioStarted) {
      setShimmer(isPinching);
    }
  }, [isPinching, audioStarted, setShimmer]);

  // Hit-testing and Hysteresis loop
  useEffect(() => {
    if (!isReady || count === 0) {
      if (activeChord !== null) {
        setActiveChord(null);
        stopChord();
      }
      return;
    }

    // While Fist gesture is active, freeze the active chord state
    if (isFist) {
      return;
    }

    let rawDetectedSegment = null;

    if (landmarks && landmarks[8]) {
      const indexTip = landmarks[8];
      const svgX = indexTip.x * 400;
      const svgY = indexTip.y * 400;

      const dist = Math.hypot(svgX - 200, svgY - 200);

      // Valid distance range: 60px to 150px
      if (dist >= 60 && dist <= 150) {
        let angle = Math.atan2(svgY - 200, svgX - 200);
        if (angle < 0) angle += 2 * Math.PI;

        const segmentAngle = (2 * Math.PI) / count;
        const segmentIdx = Math.floor(angle / segmentAngle);

        if (segmentIdx >= 0 && segmentIdx < count) {
          rawDetectedSegment = segmentIdx;
        }
      }
    }

    // 3-frame hysteresis check
    if (rawDetectedSegment === pendingSegmentRef.current) {
      pendingCountRef.current += 1;
    } else {
      pendingSegmentRef.current = rawDetectedSegment;
      pendingCountRef.current = 1;
    }

    if (pendingCountRef.current >= 3) {
      const targetChord =
        pendingSegmentRef.current !== null
          ? uniqueChords[pendingSegmentRef.current]
          : null;

      if (targetChord !== activeChord) {
        setActiveChord(targetChord);
        if (audioStarted) {
          if (targetChord) {
            playChord(targetChord);
          } else {
            stopChord();
          }
        }
      }
    }
  }, [
    landmarks,
    isReady,
    count,
    isFist,
    uniqueChords,
    activeChord,
    audioStarted,
    playChord,
    stopChord,
  ]);

  const handleStartAudio = async () => {
    try {
      await Tone.start();
      setAudioStarted(true);
      if (activeChord) {
        playChord(activeChord);
      }
    } catch (err) {
      console.error('Audio Context start error:', err);
    }
  };

  // Empty state fallback
  if (count === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line p-6 text-center">
        <Music className="h-8 w-8 text-ink-faint" />
        <span className="text-sm text-ink-muted">No chords were detected in this track, so there is nothing to play.</span>
      </div>
    );
  }

  // Fingertip coordinates for SVG overlay
  const fingertip = landmarks && landmarks[8] ? landmarks[8] : null;
  const fingertipX = fingertip ? fingertip.x * 400 : null;
  const fingertipY = fingertip ? fingertip.y * 400 : null;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Top Banner & Control Bar */}
      <div className="flex w-full flex-col items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 sm:flex-row">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium text-ink">
            <Hand className="h-4 w-4 text-brand" /> Play chords with your hand
          </h4>
          <p className="mt-0.5 text-xs text-ink-muted">
            Point at a segment to sound its triad. Make a fist to hold it; pinch for shimmer.
          </p>
        </div>

        {!audioStarted && (
          <button onClick={handleStartAudio} className="btn-primary inline-flex shrink-0 items-center gap-2 text-sm !px-4 !py-2">
            <Volume2 className="h-4 w-4" /> Start
          </button>
        )}
      </div>

      {/* Main Wheel & Video Stage */}
      <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden border border-glass-border bg-canvas/80 shadow-2xl flex items-center justify-center">
        {/* Webcam feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-50 scale-x-[-1]"
        />

        {/* Loading Overlay */}
        {!isReady && !error && (
          <div className="absolute inset-0 bg-canvas/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-ink-muted">Starting camera and hand tracking…</span>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-canvas/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 p-6 text-center z-30">
            <VideoOff className="h-8 w-8 text-danger" />
            <p className="text-sm text-ink-muted">{error}</p>
            <button onClick={start} className="btn-primary text-sm !px-5 !py-2">
              Try the camera again
            </button>
          </div>
        )}

        {/* SVG Interactive Wheel & Hand Overlay */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Inner Deadzone Circle */}
          <circle cx="200" cy="200" r="60" fill="rgba(13,8,8,0.4)" stroke="color-mix(in_oklab,var(--ink)_10%,transparent)" strokeDasharray="4 4" />

          {/* Wheel Segments */}
          {uniqueChords.map((chord, idx) => {
            const angleStep = 360 / count;
            const startAngle = idx * angleStep;
            const endAngle = (idx + 1) * angleStep;
            const midAngle = startAngle + angleStep / 2;

            const isActive = activeChord === chord;
            const pathD = describeArc(200, 200, 150, startAngle, endAngle);

            const labelPos = polarToCartesian(200, 200, 110, midAngle);

            return (
              <g key={chord}>
                {/* Arc path */}
                <path
                  d={pathD}
                  fill={
                    isActive
                      ? 'color-mix(in oklab, var(--brand) 45%, transparent)'
                      : idx % 2 === 0
                      ? 'color-mix(in_oklab,var(--ink)_4%,transparent)'
                      : 'color-mix(in_oklab,var(--ink)_8%,transparent)'
                  }
                  stroke={isActive ? 'var(--color-primary)' : 'color-mix(in_oklab,var(--ink)_15%,transparent)'}
                  strokeWidth={isActive ? '3' : '1.5'}
                  filter={isActive ? 'url(#glow)' : undefined}
                  className="transition-all duration-200"
                />

                {/* Chord Label */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isActive ? 'var(--ink)' : 'color-mix(in oklab, var(--ink) 70%, transparent)'}
                  fontSize={isActive ? '16' : '13'}
                  fontWeight={isActive ? '900' : '700'}
                  className="font-headline tracking-wider uppercase transition-all duration-200"
                >
                  {chord}
                </text>
              </g>
            );
          })}

          {/* Wheel Outer Border */}
          <circle cx="200" cy="200" r="150" fill="none" stroke="color-mix(in_oklab,var(--ink)_20%,transparent)" strokeWidth="2" />

          {/* Frozen State Indicator (Dashed Ring) */}
          {isFist && (
            <circle
              cx="200"
              cy="200"
              r="156"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              strokeDasharray="8 8"
              className="animate-spin"
              style={{ animationDuration: '8s' }}
            />
          )}

          {/* Center Hub Indicator */}
          <g>
            <circle cx="200" cy="200" r="24" fill="rgba(26,16,16,0.9)" stroke="color-mix(in_oklab,var(--ink)_20%,transparent)" />
            <text
              x="200"
              y="200"
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--color-primary)"
              fontSize="10"
              fontWeight="800"
              className="font-mono uppercase"
            >
              {activeChord || 'HUB'}
            </text>
          </g>

          {/* Fingertip Indicator Dot */}
          {fingertipX !== null && fingertipY !== null && (
            <g>
              <circle
                cx={fingertipX}
                cy={fingertipY}
                r="12"
                fill="none"
                stroke={activeChord ? 'var(--color-primary)' : 'color-mix(in_oklab,var(--ink)_50%,transparent)'}
                strokeWidth="2"
                className=""
              />
              <circle
                cx={fingertipX}
                cy={fingertipY}
                r="6"
                fill={activeChord ? 'var(--brand)' : 'var(--ink)'}
                filter="url(#glow)"
              />
            </g>
          )}
        </svg>

        {/* Gesture Status Badges */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2">
            {isFist && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[0.6875rem] font-medium text-brand backdrop-blur">
                <Lock className="h-3 w-3" /> Held
              </span>
            )}
            {isPinching && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-warm/30 bg-accent-warm/10 px-2.5 py-1 text-[0.6875rem] font-medium text-accent-warm backdrop-blur">
                <Sparkles className="h-3 w-3" /> Shimmer
              </span>
            )}
          </div>

          {!audioStarted && isReady && (
            <span className="rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 text-[0.6875rem] font-medium text-warn backdrop-blur">
              Sound is off until you press Start
            </span>
          )}
        </div>
      </div>

      {/* Active chord */}
      <div className="flex w-full max-w-md items-center justify-between rounded-xl border border-line bg-surface p-4">
        <div>
          <span className="block text-xs text-ink-muted">Playing</span>
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">{activeChord || '—'}</span>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
          <span className={clsx('h-2 w-2 rounded-full', activeChord ? 'bg-brand' : 'bg-line-strong')} />
          {activeChord ? 'Triad sounding' : 'Point at a segment'}
        </span>
      </div>
    </div>
  );
}

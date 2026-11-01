import { useId } from 'react'
import type { InstrumentKind } from '../chemistry/types'
import { isContainer } from '../chemistry/instruments'
import { geometry } from './geometry'

export function Glassware({
  kind,
  heated = false,
  active = false,
  mini = false,
  level = 0.5,
}: {
  kind: InstrumentKind
  heated?: boolean
  active?: boolean
  mini?: boolean
  level?: number
}) {
  const raw = useId()
  const id = raw.replace(/:/g, '')
  const glass = 'url(#glass' + id + ')'
  const edge = 'url(#edge' + id + ')'
  const waterY = 175 - 72 * Math.max(0, Math.min(1, level)),
    waterRadius = 49 + ((175 - waterY) / 72) * 18
  let content
  if (isContainer(kind)) {
    const g = geometry(kind)
    content = (
      <>
        <path
          d={g.outline}
          fill={kind === 'crucible' ? '#e8e5dc' : glass}
          stroke={edge}
          strokeWidth="1.8"
        />
        <path
          d={g.outline}
          fill="none"
          stroke="#fff"
          strokeWidth="0.7"
          transform="translate(1 -1)"
          opacity="0.8"
        />
        {['beaker', 'cylinder', 'testTube'].includes(kind) &&
          [0, 1, 2, 3, 4].map((i) => (
            <g key={i} opacity=".55">
              <path
                d={
                  'M' +
                  (kind === 'testTube' ? 85 : kind === 'cylinder' ? 80 : 96) +
                  ' ' +
                  (75 + i * 19) +
                  ' h15'
                }
                stroke="#749698"
                strokeWidth="1"
              />
              {kind === 'beaker' && (
                <text x="91" y={78 + i * 19} textAnchor="end" fontSize="7" fill="#6d9291">
                  {200 - i * 40}
                </text>
              )}
            </g>
          ))}
        {['flask', 'roundFlask', 'gasJar', 'testTube'].includes(kind) ? (
          <>
            <ellipse
              cx="80"
              cy={g.mouth}
              rx={kind === 'testTube' ? 23 : kind === 'gasJar' ? 20 : 17}
              ry="4"
              fill="#e4f2f0"
              fillOpacity=".48"
              stroke="#8eaaa8"
              strokeWidth="1.5"
            />
            <path
              d={
                kind === 'testTube'
                  ? 'M66 38 L66 160 Q66 177 72 182'
                  : kind === 'gasJar'
                    ? 'M49 65 L49 167'
                    : kind === 'roundFlask'
                      ? 'M60 102 Q31 136 57 166'
                      : 'M70 45 L70 79 L41 153'
              }
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              opacity=".72"
            />
          </>
        ) : (
          <path
            d={kind === 'dish' ? 'M28 133 Q79 153 131 134' : 'M45 57 L45 166 Q45 177 54 178'}
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".7"
          />
        )}
        {kind === 'beaker' && (
          <>
            <path d="M40 42 L123 42" stroke="#91aaa6" strokeWidth="2" />
            <path d="M72 153 h30" stroke="#a5b8af" strokeWidth=".8" />
            <text x="86" y="167" fontSize="6.5" fill="#89a29d" textAnchor="middle">
              BORO 3.3
            </text>
          </>
        )}
        {heated && (
          <path
            d={g.outline}
            fill="none"
            stroke="#e8a463"
            strokeWidth="3"
            opacity=".25"
            className="heated-glow"
          />
        )}
      </>
    )
  } else
    switch (kind) {
      case 'lamp':
        content = (
          <>
            <ellipse cx="80" cy="184" rx="39" ry="8" fill="#879da1" opacity=".16" />
            <path
              d="M49 136 Q40 145 42 174 Q43 184 80 185 Q117 184 118 174 Q120 145 111 136 Z"
              fill={glass}
              stroke={edge}
              strokeWidth="1.8"
            />
            <path
              d="M45 158 Q80 168 115 158 L114 175 Q80 184 46 175 Z"
              fill="#d6c4a5"
              opacity=".5"
            />
            <ellipse cx="80" cy="138" rx="32" ry="7" fill="#d1d8d2" stroke="#92a39b" />
            <path d="M72 124 h16 l3 12 h-22 Z" fill="#8c9995" />
            <path d="M77 113 h6 v12 h-6 Z" fill="#5c685f" />
            {heated && (
              <g className={active ? 'flame dancing' : 'flame'}>
                <path
                  d="M80 51 C64 74 67 82 61 98 C55 118 70 126 80 126 C100 126 108 111 96 92 C89 82 90 68 80 51"
                  fill="url(#fire)"
                />
                <path d="M80 88 C66 111 74 125 80 125 C94 123 92 109 80 88" fill="#74c9e5" />
                <path d="M80 101 Q72 118 80 124 Q87 116 80 101" fill="#e1f5ff" />
              </g>
            )}
            <path
              d="M50 147 L49 169"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              opacity=".6"
            />
          </>
        )
        break
      case 'stand':
        content = (
          <>
            <path d="M28 180 L126 180 L137 192 L17 192 Z" fill="#53635f" />
            <path d="M27 180 L124 180 L124 185 L27 185 Z" fill="#84938d" />
            <rect x="45" y="26" width="6" height="157" rx="3" fill="url(#metal)" />
            <rect x="46" y="62" width="69" height="5" rx="2" fill="url(#metal)" />
            <path
              d="M109 56 Q128 56 128 66 Q128 76 109 76"
              fill="none"
              stroke="#64746d"
              strokeWidth="4"
            />
            <circle cx="48" cy="65" r="7" fill="#53655d" />
            <path d="M44 64 h9" stroke="#d1dbd1" strokeWidth="1.5" />
          </>
        )
        break
      case 'dropper':
        content = (
          <>
            <g transform="rotate(24 80 95)">
              <rect x="65" y="30" width="30" height="47" rx="13" fill="#45685d" />
              <path
                d="M71 73 h18 v73 l-7 29 h-4 l-7-29 Z"
                fill={glass}
                stroke={edge}
                strokeWidth="1.5"
              />
              <path d="M75 91 v50" stroke="white" strokeWidth="3" opacity=".7" />
            </g>
            {active && <circle className="drop-fall" cx="55" cy="180" r="4" fill="#85c5d5" />}
          </>
        )
        break
      case 'rod':
        content = (
          <g transform="rotate(22 80 106)">
            <rect
              x="76"
              y="25"
              width="8"
              height="170"
              rx="4"
              fill={glass}
              stroke="#92aaa5"
              strokeWidth="1.3"
            />
            <path d="M79 30 v157" stroke="white" strokeWidth="2" opacity=".85" />
          </g>
        )
        break
      case 'funnel':
        content = (
          <>
            <path
              d="M24 53 L73 114 L73 174 L87 167 L87 114 L136 53 Z"
              fill={glass}
              stroke={edge}
              strokeWidth="1.5"
            />
            <path d="M31 56 L78 108 L129 56" fill="#f5f0df" fillOpacity=".8" stroke="#d9d7c1" />
            <ellipse cx="80" cy="53" rx="56" ry="12" fill={glass} stroke="#91aaa3" />
            <path d="M44 69 L69 101 M78 122 v40" stroke="white" strokeWidth="3" opacity=".75" />
          </>
        )
        break
      case 'tube':
        content = (
          <>
            <path
              d="M25 163 V72 Q25 46 51 46 H107 Q134 46 134 72 V161"
              fill="none"
              stroke="#99b1a9"
              strokeWidth="9"
            />
            <path
              d="M25 163 V72 Q25 46 51 46 H107 Q134 46 134 72 V161"
              fill="none"
              stroke="#e4eeea"
              strokeWidth="6"
            />
            <path
              d="M23 160 V73 Q23 44 51 44 H107"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              opacity=".9"
            />
          </>
        )
        break
      case 'trough':
        content = (
          <>
            <path
              d="M12 103 L31 176 Q80 193 129 176 L148 103"
              fill={glass}
              stroke={edge}
              strokeWidth="2"
            />
            <path
              d={
                'M' +
                (80 - waterRadius) +
                ' ' +
                waterY +
                ' L33 171 Q80 187 127 171 L' +
                (80 + waterRadius) +
                ' ' +
                waterY +
                ' Z'
              }
              fill="#b4dce7"
              fillOpacity={level > 0.001 ? '.6' : '0'}
            />
            <ellipse
              cx="80"
              cy="103"
              rx="68"
              ry="20"
              fill={glass}
              stroke="#9bafa8"
              strokeWidth="1.5"
            />
            <ellipse
              cx="80"
              cy={waterY}
              rx={waterRadius}
              ry="16"
              fill="#c2e1e8"
              fillOpacity={level > 0.001 ? '.5' : '0'}
              stroke="#9ac6d1"
            />
            <path d="M27 133 L36 162" stroke="white" strokeWidth="4" opacity=".7" />
          </>
        )
        break
      case 'thermometer':
        content = (
          <>
            <rect x="71" y="26" width="18" height="135" rx="9" fill="#f0f3e9" stroke="#9cafa7" />
            <circle cx="80" cy="167" r="17" fill="#edf0e4" stroke="#9cafa7" />
            <rect x="77" y="77" width="6" height="86" rx="3" fill="#c97664" />
            <circle cx="80" cy="167" r="11" fill="#c97664" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path key={i} d={'M83 ' + (46 + i * 15) + ' h4'} stroke="#839b8f" />
            ))}
          </>
        )
        break
      case 'clamp':
        content = (
          <g transform="rotate(-25 80 105)">
            <path
              d="M57 32 L72 155 Q74 180 88 180 Q100 180 105 160 L115 35"
              fill="none"
              stroke="#b69a71"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path d="M62 75 L107 75 M65 90 L105 90" stroke="#809087" strokeWidth="3" />
            <path d="M74 155 L97 155" stroke="#8a785b" strokeWidth="3" />
          </g>
        )
        break
      case 'stopper':
        content = (
          <>
            <path d="M47 79 L55 133 Q80 143 105 133 L113 79" fill="#5c6e64" />
            <ellipse cx="80" cy="79" rx="33" ry="10" fill="#8b9c8c" />
            <ellipse cx="80" cy="77" rx="5" ry="2" fill="#364d41" />
            <path d="M55 87 L61 126" stroke="#9aaa97" strokeWidth="3" opacity=".5" />
          </>
        )
        break
    }
  return (
    <svg
      className={'glassware-svg' + (mini ? ' mini' : '')}
      viewBox="0 0 160 210"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={'glass' + id} x1="0" x2="1">
          <stop offset="0" stopColor="#98b8b3" stopOpacity=".18" />
          <stop offset=".12" stopColor="#fff" stopOpacity=".56" />
          <stop offset=".35" stopColor="#e8f4ee" stopOpacity=".08" />
          <stop offset=".8" stopColor="#f8fffb" stopOpacity=".28" />
          <stop offset="1" stopColor="#7faaa5" stopOpacity=".25" />
        </linearGradient>
        <linearGradient id={'edge' + id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#b6cdc3" />
          <stop offset=".45" stopColor="#73978e" />
          <stop offset=".7" stopColor="#d5e4d6" />
          <stop offset="1" stopColor="#72948b" />
        </linearGradient>
        <linearGradient id="metal">
          <stop stopColor="#586e62" />
          <stop offset=".45" stopColor="#cad6c7" />
          <stop offset=".65" stopColor="#92a491" />
          <stop offset="1" stopColor="#5e7764" />
        </linearGradient>
        <radialGradient id="fire">
          <stop stopColor="#fff4b8" />
          <stop offset=".4" stopColor="#f5c160" />
          <stop offset=".8" stopColor="#ed9a48" stopOpacity=".85" />
          <stop offset="1" stopColor="#e88238" stopOpacity=".2" />
        </radialGradient>
      </defs>
      {content}
    </svg>
  )
}

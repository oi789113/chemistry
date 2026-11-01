import type { Lesson, Simulation } from './types'
import { addReagent, createVessel, emptySimulation } from './engine'
import { substanceMap } from './substances'

const gasApparatus: Lesson['apparatus'] = [
  { kind: 'flask', x: 35, y: 49 },
  { kind: 'gasJar', x: 74, y: 49 },
  { kind: 'stand', x: 20, y: 44 },
  { kind: 'tube', x: 55, y: 25 },
  { kind: 'lamp', x: 35, y: 80 },
]
export const lessons: Lesson[] = [
  {
    id: 'peroxide',
    title: '过氧化氢催化分解',
    subtitle: '一点催化剂，让变化加速发生',
    tag: '气体制备',
    color: '#609f8e',
    icon: 'O₂',
    reactionId: 'peroxide',
    apparatus: gasApparatus,
    initial: [{ vessel: 0, id: 'H2O2', mmol: 10, volumeMl: 20 }],
    steps: [
      { text: '连接发生瓶与集气瓶，建立气体通路。', action: 'connect', label: '连接导管' },
      { text: '先播放 5 秒，观察未加催化剂时的缓慢分解。', action: 'play', label: '开始观察' },
      { text: '加入 0.1 g MnO₂，对比气泡生成速率。', action: 'catalyst', label: '加入 MnO₂' },
      {
        text: '观察集气量；切换微观模式，追踪反应物和生成物。',
        action: 'micro',
        label: '查看微观粒子',
      },
    ],
    explanation: '催化剂改变反应速度，不改变最终氧气产量。可重置后改变用量进行对比。',
  },
  {
    id: 'permanganate',
    title: '高锰酸钾加热制氧气',
    subtitle: '从晶体中释放氧气',
    tag: '加热分解',
    color: '#9471ae',
    icon: 'Δ',
    reactionId: 'permanganate',
    apparatus: [
      { kind: 'testTube', x: 36, y: 46 },
      { kind: 'gasJar', x: 74, y: 49 },
      { kind: 'stand', x: 22, y: 43 },
      { kind: 'tube', x: 56, y: 24 },
      { kind: 'lamp', x: 36, y: 80 },
    ],
    initial: [{ vessel: 0, id: 'KMnO4', mmol: 6 }],
    steps: [
      { text: '固定试管，并连接集气装置。', action: 'connect', label: '固定并连接' },
      { text: '点燃酒精灯，使固体温度达到约 200 ℃。', action: 'heat', label: '点燃加热' },
      { text: '观察紫黑色固体变化与氧气收集。', action: 'play', label: '播放反应' },
      {
        text: '先断开导管，再熄灯，防止实际实验中的倒吸。',
        action: 'finishHeat',
        label: '断管并熄灯',
      },
    ],
    explanation: '加热阈值为教学近似。真实制氧装置还需要棉花、检漏和防倒吸等规范操作。',
  },
  {
    id: 'carbonate',
    title: '碳酸钙与盐酸制二氧化碳',
    subtitle: '观察气泡与固体的消失',
    tag: '气体制备',
    color: '#b69c66',
    icon: 'CO₂',
    reactionId: 'carbonate-acid',
    apparatus: gasApparatus,
    initial: [{ vessel: 0, id: 'CaCO3', mmol: 5 }],
    steps: [
      {
        text: '连接发生瓶与集气瓶。CO₂ 在本模型中按导管收集计量。',
        action: 'connect',
        label: '连接导管',
      },
      { text: '加入 20 mL、0.5 mol/L 的稀盐酸。', action: 'carbonateAcid', label: '加入稀盐酸' },
      { text: '开始反应，观察固体表面生成的气泡。', action: 'play', label: '开始反应' },
      { text: '进入微观视图，比较反应前后的原子组成。', action: 'micro', label: '查看微观粒子' },
    ],
    explanation: 'CaCO₃ 与 HCl 的物质的量比为 1:2。限量试剂决定 CO₂ 的理论产量。',
  },
  {
    id: 'hydrogen',
    title: '锌与稀硫酸制氢气',
    subtitle: '金属与酸的置换反应',
    tag: '气体制备',
    color: '#7598b2',
    icon: 'H₂',
    reactionId: 'zinc-acid',
    apparatus: gasApparatus,
    initial: [{ vessel: 0, id: 'Zn', mmol: 5 }],
    steps: [
      { text: '连接发生瓶与集气瓶，保持远离火源。', action: 'connect', label: '连接导管' },
      { text: '加入 20 mL、0.25 mol/L 的稀硫酸。', action: 'zincAcid', label: '加入稀硫酸' },
      { text: '观察锌粒缓慢消耗与氢气生成。', action: 'play', label: '开始反应' },
      { text: '对照微观粒子，理解金属置换出氢。', action: 'micro', label: '查看微观粒子' },
    ],
    explanation: '这里只模拟稀硫酸体系。氢气可燃，真实实验须检验纯度；此处不提供点燃氢气操作。',
  },
  {
    id: 'precipitation',
    title: '硫酸铜与氢氧化钠',
    subtitle: '让蓝色沉淀慢慢浮现',
    tag: '沉淀反应',
    color: '#579ac3',
    icon: '↓',
    reactionId: 'copper-precipitate',
    apparatus: [
      { kind: 'beaker', x: 42, y: 52 },
      { kind: 'dropper', x: 68, y: 26 },
      { kind: 'rod', x: 76, y: 48 },
    ],
    initial: [{ vessel: 0, id: 'CuSO4', mmol: 5, volumeMl: 20 }],
    steps: [
      {
        text: '向蓝色硫酸铜溶液中加入 20 mL、0.5 mol/L 的 NaOH。',
        action: 'precipitateBase',
        label: '加入 NaOH',
      },
      { text: '开始反应，观察絮状颗粒生成并下沉。', action: 'play', label: '开始反应' },
      { text: '用玻璃棒轻轻搅拌，观察沉淀悬浮。', action: 'stir', label: '轻轻搅拌' },
      { text: '查看离子结合形成难溶固体的示意。', action: 'micro', label: '查看离子反应' },
    ],
    explanation: '蓝色沉淀是 Cu(OH)₂；不能把它标注为硫酸铜或金属铜。颜色与沉淀量、剩余 Cu²⁺ 联动。',
  },
  {
    id: 'displacement',
    title: '铁与硫酸铜置换',
    subtitle: '铁的表面，长出紫红色的铜',
    tag: '氧化还原',
    color: '#b88063',
    icon: 'Fe',
    reactionId: 'iron-copper',
    apparatus: [
      { kind: 'beaker', x: 43, y: 52 },
      { kind: 'rod', x: 73, y: 43 },
    ],
    initial: [{ vessel: 0, id: 'CuSO4', mmol: 5, volumeMl: 30 }],
    steps: [
      { text: '将 5 mmol 铁加入硫酸铜溶液。', action: 'iron', label: '放入铁片' },
      { text: '播放反应，观察铜析出与蓝色褪去。', action: 'play', label: '开始反应' },
      { text: '查看 Fe、Fe²⁺ 和 Cu²⁺ 的变化。', action: 'micro', label: '查看电子转移' },
    ],
    explanation: '生成的硫酸亚铁呈浅绿色。微观视图是粒子组成的教学抽样，不代表全部真实分子数。',
  },
  {
    id: 'neutralization',
    title: '酸碱中和反应',
    subtitle: '用温度和 pH 发现无声的变化',
    tag: '酸碱反应',
    color: '#ca879e',
    icon: 'pH',
    reactionId: 'neutralization',
    apparatus: [
      { kind: 'beaker', x: 42, y: 52 },
      { kind: 'dropper', x: 68, y: 27 },
      { kind: 'thermometer', x: 76, y: 48 },
    ],
    initial: [
      { vessel: 0, id: 'NaOH', mmol: 5, volumeMl: 20 },
      { vessel: 0, id: 'C20H14O4', mmol: 0.002, volumeMl: 0.05 },
    ],
    steps: [
      { text: '读取碱液的初始温度与 pH；酚酞呈粉红色。', action: 'measure', label: '读取温度' },
      {
        text: '加入等物质的量的盐酸，观察红色褪去。',
        action: 'neutralAcid',
        label: '加入 20 mL 盐酸',
      },
      { text: '播放中和过程，比较反应前后的温度。', action: 'play', label: '观察温升' },
      { text: '查看 H⁺ 与 OH⁻ 形成水的离子反应。', action: 'micro', label: '查看离子反应' },
    ],
    explanation:
      'pH 由当前强酸强碱的净当量估算；混合后的酸碱平衡按快速建立处理，反应动画为放慢示意。',
  },
  {
    id: 'indicator',
    title: '酚酞与酸碱指示',
    subtitle: '一滴溶液，一次颜色的转变',
    tag: '指示剂',
    color: '#c3789b',
    icon: '◉',
    apparatus: [
      { kind: 'beaker', x: 42, y: 52 },
      { kind: 'dropper', x: 68, y: 28 },
      { kind: 'rod', x: 77, y: 47 },
    ],
    initial: [
      { vessel: 0, id: 'H2O', mmol: 1110, volumeMl: 20 },
      { vessel: 0, id: 'C20H14O4', mmol: 0.002, volumeMl: 0.05 },
    ],
    steps: [
      {
        text: '向水和酚酞中滴入 0.05 mL、0.1 mol/L 的 NaOH。',
        action: 'indicatorBase',
        label: '滴加一滴 NaOH',
      },
      { text: '播放，观察碱性环境下的粉红色。', action: 'play', label: '观察颜色' },
      {
        text: '滴入等量 HCl，使 pH 回到中性附近。',
        action: 'indicatorAcid',
        label: '滴加一滴 HCl',
      },
      { text: '对比 pH 与显色范围（约 8.2–10.0）。', action: 'measure', label: '记录现象' },
    ],
    explanation:
      '指示剂变色是可逆的酸碱平衡。这里只用平滑显色函数示意，不把酚酞当作被消耗的反应物。',
  },
  {
    id: 'magnesium',
    title: '镁条燃烧',
    subtitle: '耀眼白光之后，留下白色粉末',
    tag: '燃烧实验',
    color: '#c8a465',
    icon: 'Mg',
    reactionId: 'magnesium',
    apparatus: [
      { kind: 'crucible', x: 43, y: 51 },
      { kind: 'lamp', x: 43, y: 78 },
      { kind: 'clamp', x: 68, y: 36 },
      { kind: 'stand', x: 24, y: 45 },
    ],
    initial: [{ vessel: 0, id: 'Mg', mmol: 5 }],
    steps: [
      { text: '用夹具固定坩埚，保持空气环境。', action: 'support', label: '固定坩埚' },
      { text: '点燃酒精灯，升温至镁的教学点燃阈值约 500 ℃。', action: 'heat', label: '点燃加热' },
      { text: '播放，观察白光与白色氧化镁生成。', action: 'play', label: '观察燃烧' },
      { text: '结束加热；对比固体反应前后的质量来源。', action: 'finishHeat', label: '熄灭酒精灯' },
    ],
    explanation:
      '氧来自空气，输入量记入守恒账本。本模型仅模拟主要产物 MgO，省略空气燃烧的少量副产物。',
  },
  {
    id: 'separation',
    title: '过滤、蒸发与结晶',
    subtitle: '从盐和砂的混合物中找回晶体',
    tag: '物理分离',
    color: '#ad9b77',
    icon: '◇',
    apparatus: [
      { kind: 'beaker', x: 28, y: 49 },
      { kind: 'dish', x: 69, y: 57 },
      { kind: 'funnel', x: 69, y: 27 },
      { kind: 'rod', x: 46, y: 28 },
      { kind: 'lamp', x: 69, y: 80 },
    ],
    initial: [
      { vessel: 0, id: 'NaCl', mmol: 55, phase: 's' },
      { vessel: 0, id: 'SiO2', mmol: 8 },
    ],
    steps: [
      {
        text: '加入 10 mL 水，用玻璃棒搅拌至氯化钠溶解。',
        action: 'dissolve',
        label: '加水并搅拌',
      },
      { text: '播放并等待盐溶解；砂粒不溶。', action: 'play', label: '开始溶解' },
      {
        text: '用漏斗过滤至蒸发皿，固体滤渣留在原容器中表示。',
        action: 'filter',
        label: '过滤至蒸发皿',
      },
      { text: '加热滤液，水减少后析出白色晶体。', action: 'evaporate', label: '加热并观察结晶' },
    ],
    explanation:
      '溶解、过滤、蒸发和结晶都是物理变化，不编造化学方程式。NaCl 溶解度使用近似温度曲线。',
  },
]
export const lessonMap = Object.fromEntries(lessons.map((l) => [l.id, l])) as Record<string, Lesson>
export function createLesson(id: string): Simulation {
  const lesson = lessonMap[id]
  const sim = emptySimulation()
  lesson.apparatus.forEach((a, i) => sim.vessels.push(createVessel(a.kind, 'v' + i, a.x, a.y)))
  lesson.initial.forEach((p) =>
    addReagent(
      sim.vessels[p.vessel],
      p.id,
      p.mmol,
      p.phase ?? substanceMap[p.id].phase,
      p.volumeMl ?? 0,
    ),
  )
  sim.events.push({ time: 0, text: '已准备：' + lesson.title })
  return sim
}

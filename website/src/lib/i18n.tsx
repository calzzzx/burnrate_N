'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'burnrate-locale'

export type Locale = 'en' | 'zh'

const dict = {
  en: {
    nav: { download: 'Download' },
    hero: {
      title: 'Stop the Subscription Creep. See Your Money in Motion.',
      subtitle: 'ChatGPT, Netflix, iCloud, SaaS... it adds up fast. BurnRate gives you a live, beautiful dashboard in your macOS menu bar to track every cent, automatically converted to your local currency.',
      cta: 'Download for macOS',
      badge: 'Free & Open Source · No Account Required',
      unsignedTitle: 'Heads up: macOS may say "BurnRate is damaged"',
      unsignedNote: 'Apple charges $99/yr to be a registered developer — more than this free project can cover, so the app isn\'t notarized. macOS may refuse to open it, often claiming it\'s "damaged" (it isn\'t).\nBefore opening BurnRate the first time, paste this into Terminal:',
      unsignedCmd: 'xattr -dr com.apple.quarantine /Applications/BurnRate.app',
      copy: 'Copy',
      copied: 'Copied',
    },
    features: {
      heading: 'Master your digital cash flow.',
      subheading: 'Knowledge is the best budget tool.',
      menubar: {
        title: 'Seamless System Integration',
        desc: 'No heavy windows or distracting apps. A single click on your menu bar reveals your total monthly burn and upcoming bills.',
      },
      instant: {
        title: '80+ Smart Presets',
        desc: 'From AI tools to streaming services. Pick a preset, and we\'ll handle the logos and pricing. Custom services take seconds to add.',
      },
      realtime: {
        title: 'The Burn Odometer',
        desc: 'Switch to the Burn View to watch your daily spending tick up in real-time. It\'s a powerful visual reminder of your subscription velocity.',
      },
      private: {
        title: 'Local-First, Privacy-Always',
        desc: 'Your financial data is yours alone. Everything is stored in a local SQLite database. No cloud, no tracking, no leaks. Ever.',
      },
    },
    burn: {
      title: 'See your money burn. Literally.',
      subtitle: 'The Burn Counter translates your monthly subscriptions into a per-second cost, visualized as a ticking odometer for your digital life.',
      label: 'burned today',
      ofDaily: 'of $328.57/day',
    },
    showcase: {
      title: 'Know exactly where every dollar goes.',
      subtitle: 'Detailed category breakdowns, automated multi-currency conversion, and billing cycle alerts. Total clarity on your recurring spending.',
      cat: { ai: 'AI Tools', dev: 'Development', design: 'Design', media: 'Media', cloud: 'Cloud Ops' },
    },
    download: {
      title: 'Take back control of your subscriptions.',
      subtitle: 'Lightweight, private, and forever free. Download the .dmg and start seeing your burn rate in seconds.',
      cta: 'Download for macOS',
      dmg: 'Download .dmg',
      requirements: 'macOS 12.0+ · Apple Silicon (M1 and later)',
    },
    footer: {
      rights: 'BurnRate. Open Source on GitHub.',
      github: 'GitHub',
    },
  },
  zh: {
    nav: { download: '立即下载' },
    hero: {
      title: '告别订阅焦虑，\n让消费速率实时可见。',
      subtitle: '从 ChatGPT 到影音会员，数字化生活充满了隐形账单。\nBurnRate 为您实时监控订阅支出，让每一分钱的流向都清晰明了。',
      cta: '免费下载 macOS 版',
      badge: '开源免费 · 无需注册 · 本地存储',
      unsignedTitle: '注意：macOS 可能提示「应用程序已损坏」或「未受信任」',
      unsignedNote: '注册 Apple 开发者每年要交 99 美元，这个免费小项目实在负担不起，所以应用没有做公证，macOS 多半会拒绝打开，甚至提示「已损坏」（其实并没有）。\n首次打开 BurnRate 前，把下面这行命令粘贴到「终端」执行一下即可正常打开。',
      unsignedCmd: 'xattr -dr com.apple.quarantine /Applications/BurnRate.app',
      copy: '复制',
      copied: '已复制',
    },
    features: {
      heading: '掌控每一分数字现金流，',
      subheading: '最好的订阅管理工具是一目了然。',
      menubar: {
        title: '安静常驻菜单栏',
        desc: '拒绝笨重的窗口。点击菜单栏图标即可查看月度总支出和近期账单，像系统组件一样自然、高效。',
      },
      instant: {
        title: '80+ 订阅服务预设',
        desc: '内置 AI 工具、开发环境、影音娱乐及云服务预设。选择即添加，自动填入价格。也支持秒级创建自定义服务。',
      },
      realtime: {
        title: '实时消耗计数器',
        desc: '切换至 Burn 视图，看着今日支出随秒针实时跳动。它是您钱包的里程表，时刻提醒消费速度。',
      },
      private: {
        title: '本地优先，绝对私密',
        desc: '所有信息仅存储于本地 SQLite 数据库。无追踪、无账户、不联网，支持一键导出导入，安全至极。',
      },
    },
    burn: {
      title: '看着钱在燃烧，\n真实且直观。',
      subtitle: '消耗计数器将您的月度订阅换算为每秒支出，\n通过实时跳动的数字，让抽象的账单获得具象的流逝感。',
      label: '今日已消耗',
      ofDaily: '日均预计 ¥328.57',
    },
    showcase: {
      title: '每一分钱花在哪，\n一清二楚。',
      subtitle: '多维度分类统计、自动汇率换算、精准账单周期提醒。\n全方位洞察您的订阅结构，优化不必要开支。',
      cat: { ai: 'AI 工具', dev: '开发工具', design: '设计艺术', media: '影音娱乐', cloud: '云服务' },
    },
    download: {
      title: '现在就开始\n掌控您的订阅。',
      subtitle: '轻量、私密、永久免费。下载 APP，数秒内开启您的订阅追踪之旅。',
      cta: '下载 macOS 版',
      dmg: '下载 .dmg 安装镜像',
      requirements: '支持 macOS 12.0 或更高版本 · Apple 芯片 (M1 及更新机型)',
    },
    footer: {
      rights: 'BurnRate. Made By Mutian',
      github: 'GitHub 仓库',
    },
  },
}

type Dict = typeof dict.en

interface I18nContextType {
  locale: Locale
  t: Dict
  toggle: () => void
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  t: dict.en,
  toggle: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR renders the default ('zh'); a stored/detected preference is applied
  // after mount to keep server and client markup identical on first paint.
  const [locale, setLocale] = useState<Locale>('zh')

  useEffect(() => {
    // Reading the saved/browser preference is only possible after mount, so a
    // one-time state sync here is intentional (and avoids a hydration mismatch).
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'zh') {
      setLocale(stored)
      return
    }
    // No saved choice: fall back to the browser's language.
    if (!navigator.language?.toLowerCase().startsWith('zh')) setLocale('en')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* storage unavailable (private mode) — ignore */
    }
  }, [locale])

  const toggle = useCallback(() => setLocale(l => (l === 'en' ? 'zh' : 'en')), [])

  return (
    <I18nContext.Provider value={{ locale, t: dict[locale], toggle }}>
      {children}
    </I18nContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  return useContext(I18nContext)
}

'use strict'

const CONFIG_DEFAULT = {
  lang: 'ko',
  style: {
    // body
    'body-margin': '0.25rem',
    'body-font': "'Roboto Mono', 'Source Han Sans', 'MalgunGotinc', '본고딕', '맑은 고딕', sans-serif",
    // header / ui
    'header-bg': 'rgba(223, 223, 223, 0.8)',
    'header-fg': '#111',
    'content-bg': 'rgba(0, 0, 0, 0.5)',
    'content-fg': '#eee',
    'color-accent': '#FF6F00',
    'shadow-card': '0 0.05rem 0.25rem rgba(0, 0, 0, 0.5)',
    'shadow-text': '0 0       0.125em rgba(0, 0, 0, 1)',
    'font-size-small': '0.75rem',
    'graph-height': '1.5rem'
  },
  tabs: [
    {
      label: '딜',
      gauge: 'deal.total',
      sort: '+damage',
      subgauge: false,
      col: [
        'i.icon',
        [
          ['i.name'],
          ['i.owner']
        ], [
          ['deal.pct', 'deal.per_second', 'deal.total'],
          ['deal.accuracy', 'deal.swing', 'deal.miss']
        ], [
          ['tank.heal'],
          ['tank.damage']
        ], [
          ['deal.critical'],
          ['etc.death'],
        ]
      ]
    }, {
      label: '힐',
      gauge: 'heal.total',
      sort: '+healed',
      subgauge: false,
      col: [
        'i.icon',
        [
          ['i.name'],
          ['i.owner']
        ], [
          ['heal.pct', 'heal.per_second', 'heal.total'],
          ['heal.over', 'heal.swing', 'heal.critical']
        ],
        'heal.cure',
        'etc.death'
      ]
    }, {
      label: '모두',
      gauge: 'deal.total',
      sort: '+damage',
      subgauge: false,
      col: [
        'i.icon',
        [
          ['i.name'],
          ['deal.total', 'i.owner']
        ], [
          ['deal.per_second', 'deal.pct', 'deal.accuracy'],
          ['deal.swing', 'deal.miss', 'deal.hitfail']
        ], [
          ['deal.critical'],
          ['heal.critical'],
        ], [
          ['tank.damage', 'tank.parry'],
          ['tank.heal', 'tank.block']
        ], [
          ['heal.total', 'heal.pct'],
          ['heal.per_second', 'heal.swing', 'heal.over']
        ], [
          ['etc.death'],
          ['heal.cure']
        ]
      ]
    }
  ],
  colwidth: {
    '_i-name': 7,
    '_deal-total': 4.5,
    '_deal-per_second': 3.5,
    '_deal-pct': 3,
    '_deal-accuracy': 3,
    '_deal-swing': 3,
    '_deal-miss': 3,
    '_deal-hitfail': 3,
    '_deal-critical': 2,
    '_heal-critical': 2,
    '_tank-damage': 3.5,
    '_tank-heal': 3.5,
    '_tank-parry': 2,
    '_tank-block': 2,
    '_heal-per_second': 3,
    '_heal-pct': 3,
    '_heal-total': 4,
    '_heal-swing': 2,
    '_heal-over': 2,
    '_heal-cure': 2,
    '_etc-powerdrain': 4,
    '_etc-powerheal': 4,
    '_etc-death': 2
  },
  format: {
    significant_digit: {
      dps: 2,
      accuracy: 2,
      hps: 2
    },
    mergePet: true
  }
}

const COLUMN_SORTABLE = [
  'deal.per_second',
  'deal.total',
  'tank.damage',
  'heal.per_second',
  'heal.total'
]
const COLUMN_MERGEABLE = [
  'encdps', 'damage', 'damage%',
  'swings', 'misses', 'hitfailed',
  'crithit', 'maxhit', 'damagetaken',
  'healstaken', 'enchps', 'healed',
  'healed%', 'heals', 'critheal',
  'cures', 'powerdrain', 'powerheal'
]

const PET_MAPPING = {
  '요정 에오스': 'eos',
  '가루다 에기': 'garuda',
  '타이탄 에기': 'titan',
  '이프리트 에기': 'ifrit',
  '요정 셀레네': 'selene',
  '카벙클 에메랄드': 'emerald',
  '카벙클 토파즈': 'topaz',
  '자동포탑 룩': 'look',
  '자동포탑 비숍': 'bishop'
}

const COLUMN_INDEX = {
  i: {
    icon: {
      v: _ => resolveClass(_.Job, _.name)[0],
      f: _ => `<img src="img/class/${_.toLowerCase()}.png" class="clsicon" />`
    },
    class: {
      v: _ => resolveClass(_.Job, _.name)[0]
    },
    owner: {
      v: _ => resolveClass(_.Job, _.name)[2]
    },
    name: {
      v: _ => resolveClass(_.Job, _.name)[1],
      f: _ => _ == 'YOU'? `<span class="name-you">${_}</span>` : _
    }
  },
  // deal
  deal: {
    per_second: {
      v: 'encdps',
      f: (_, conf) => parseFloat(_).toFixed(conf.format.significant_digit.dps) || '-'
    },
    pct: {
      v: 'damage%',
      f: _ => parseInt(_) + '%'
    },
    total: 'damage',
    accuracy: { // '정확도'
      v: _ => _.swings > 0? _.misses/_.swings * 100 : -1,
      f: (_, conf) => _ < 0? '-' :  _.toFixed(conf.format.significant_digit.accuracy)
    },
    swing: 'swings',
    miss: 'misses',
    hitfail: 'hitfailed',
    critical: 'crithit%',
    maxhit: 'maxhit'
  },
  // tank
  tank: {
    damage: {
      v: 'damagetaken',
      f: _ => '-' + _
    },
    heal: {
      v: 'healstaken',
      f: _ => '+' + _
    },
    parry: 'ParryPct',
    block: 'BlockPct'
  },
  // heal
  heal: {
    per_second: {
      v: 'enchps',
      f: (_, conf) => parseFloat(_).toFixed(conf.format.significant_digit.hps) || '-'
    },
    pct: 'healed%',
    total: 'healed',
    over: 'OverHealPct',
    swing: 'heals',
    critical: 'critheal%',
    cure: 'cures'
  },
  etc: {
    powerdrain: 'powerdrain',
    powerheal: 'powerheal',
    death: 'deaths'
  }
}

;(function() {

  const copy = function copyByJsonString(o) {
    return JSON.parse(JSON.stringify(o))
  }

  class Config {

    constructor() {
      this.load()
    }

    load() {
      let localConfig = copy(CONFIG_DEFAULT)
      let rawJson = localStorage.getItem('kagerou_config')
      let o

      try {
        o = JSON.parse(o)
      } catch(e) { // broken!
        o = null
      }

      if(!o) { // anyway, it's empty, let's populate localStorage
        localStorage.setItem('kagerou_config', JSON.stringify(localConfig))
        this.config = localConfig
      } else {
        this.config = updateObject(localConfig, o)
      }

      return this.config
    }

    attachCSS(path, section) {
      let variables = copy(this.config.style)

      if(section) {
        if(!Array.isArray(section)) {
          section = [section]
        }
        section = section.map(_ => this.config[_])

        variables = Object.assign.apply(null, [variables].concat(section))
      }

      if(!Array.isArray(path)) {
        path = [path]
      }

      for(let p of path){
        let sanitizedId = p.replace(/[^a-z]/g, '_')
        let oldNode = document.getElementById(sanitizedId)

        fetch(p).then(res => {
          if(!res.ok) return ''
          return res.text()
        }).then(css => {
          for(let k in variables) {
            css = css.replace(new RegExp(`var\\(--${k}\\)`, 'g'), variables[k])
          }

          if(oldNode) { // (re)loadCSS
            oldNode.innerHTML = css
          } else {
            let node = document.createElement('style')
            node.id = sanitizedId
            node.innerHTML = css
            document.getElementsByTagName('head')[0].appendChild(node)
          }
        })
      }
    }

    get(k) {
      if(!this.config) return false
      if(k) return resolveDotIndex(this.config, k)
      else return this.config
    }

    set(k, v) {
      return resolveDotIndex(this.config, k, v)
    }

    toggle(k) {
      if(!this.config) return false
      if(typeof this.get(k) !== 'boolean') return false
      this.set(k, !this.get(k))
    }

    reset() {
      localStorage.setItem('kagerou_config', '')
    }

  }

  window.config = new Config()
  config.reset()

  config.load()
  config.attachCSS([
    'css/index.css',
    'css/nav.css'
  ], 'style')

  config.attachCSS('css/table.css', ['style', 'colwidth'])


})()
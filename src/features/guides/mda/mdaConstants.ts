export const CLR='#fbbf24';
export const AESTHETICS=[
  {id:'sensation',icon:'✨',label:'Sensation',desc:'Prazer sensorial — sons, visuais, feedback tátil'},
  {id:'fantasy',icon:'🐉',label:'Fantasy',desc:'Faz-de-conta — imersão e roleplay'},
  {id:'narrative',icon:'📖',label:'Narrative',desc:'Drama — história e progressão emocional'},
  {id:'challenge',icon:'⚡',label:'Challenge',desc:'Obstáculos — superação e maestria'},
  {id:'fellowship',icon:'🤝',label:'Fellowship',desc:'Social — cooperação e competição entre jogadores'},
  {id:'discovery',icon:'🔭',label:'Discovery',desc:'Exploração — encontrar o desconhecido'},
  {id:'expression',icon:'🎨',label:'Expression',desc:'Autodescoberta — criatividade e identidade'},
  {id:'submission',icon:'😌',label:'Submission',desc:'Passatempo — relaxamento e flow'},
];
export const STEPS=[
  {id:'aesthetics',label:'Estética',icon:'🎭',hint:'A perspectiva do jogador: que emoção o jogo deve evocar?'},
  {id:'dynamics',label:'Dinâmica',icon:'⚡',hint:'Os comportamentos que emergem durante o jogo em tempo real.'},
  {id:'mechanics',label:'Mecânica',icon:'⚙️',hint:'As regras, ações e controles que o designer escreve no código.'},
  {id:'compile',label:'Compilar',icon:'📄',hint:'Revise o documento e salve no módulo de Mecânicas.'},
];
export const GUIDE=[
  {title:'O que é Estética no MDA?',body:'Estética descreve as respostas emocionais desejadas no jogador. No MDA, partimos da estética para chegar à mecânica — o designer deve primeiro entender que experiência quer criar.\n\nO vocabulário proposto inclui 8 tipos de diversão. Um jogo pode ter múltiplos tipos, em proporções distintas. Por exemplo: Charades enfatiza Fellowship e Expression; Quake prioriza Challenge e Sensation; Final Fantasy combina Fantasy, Narrative, Discovery e Expression.\n\nEscolha os tipos que melhor descrevem a experiência-alvo e explique como eles se combinam no seu jogo.'},
  {title:'O que são Dinâmicas no MDA?',body:'Dinâmicas são comportamentos que emergem das mecânicas quando o jogador interage com o sistema em tempo real. Elas não estão escritas nas regras — surgem da interação.\n\nExemplos: em jogos de tiro, "camping" e "sniping" são dinâmicas que emergem das mecânicas de spawn e armas. Em Monopoly, a dinâmica de "rich get richer" emerge das regras de aluguel.\n\nDescreva os sistemas de feedback e tensão: como o jogo recompensa, pune e cria arcos dramáticos? Como as dinâmicas suportam as estéticas escolhidas?'},
  {title:'O que são Mecânicas no MDA?',body:'Mecânicas são as ações, comportamentos e controles disponíveis ao jogador — o que o designer literalmente programa. São a camada mais concreta do MDA.\n\nExemplos: em card games, as mecânicas de shuffle, trick-taking e betting geram a dinâmica de bluffing. No golf, balls, clubs e hazards geram a dinâmica de "broken clubs".\n\nDescreva as regras principais, os controles do jogador e como você planeja o tuning/balanceamento para garantir que as dinâmicas e estéticas pretendidas se realizem.'},
];

export const CLR='#e879f9';

export const STEPS=[
  {id:'concept',      icon:'🎯', label:'Conceito'},
  {id:'analysis',     icon:'🔍', label:'Análise'},
  {id:'interactions', icon:'🔗', label:'Interações'},
  {id:'synergy',      icon:'⚙️', label:'Sinergia'},
  {id:'compile',      icon:'📄', label:'Compilar'},
];

export const GUIDE=[
  {title:'O que é Harmonia Ludonarrativa?',
   body:'Harmonia ludonarrativa é a interação sincronizada entre mecânicas e narrativa que cria uma história unificada (Ash & Despain, 2016). Quando bem executada, o jogador sente o que está fazendo em nível emocional — não apenas narrativo.\n\nDissonância ocorre quando mecânicas e narrativa não se sincronizam. Exemplo clássico: em Watch Dogs, o UI pedia ao jogador para fazer parkour sobre a tumba de um ente querido.\n\nComeçando: defina seu high concept e a abordagem narrativa do jogo — dirigida pelo designer (The Stanley Parable) ou pelo jogador (Journey).'},
  {title:'Fase 1: Análise',
   body:'Para cada mecânica do jogo, preencha 4 elementos que formam um loop ludonarrativo:\n\n① MECÂNICA — O que o jogador faz (verbo no gerúndio: andando, pulando...)\n② NARRATIVA — Por que faz aquilo (propósito diegético)\n③ CONTEXTO — Onde/como isso acontece no espaço de jogo\n④ EMOÇÃO — O que o jogador sente ao executar isso\n\nO loop fecha quando a emoção leva o jogador de volta à mecânica. Ex: "andando → explorar → ambiente desconhecido → mistério" — o mistério compele o jogador a continuar andando.'},
  {title:'Fase 2: Interações',
   body:'Os loops individuais se conectam para formar o game loop central. A transição do último elemento de um loop deve alimentar o próximo loop.\n\nEx: "ouvindo o Geiger Counter (descoberta, maravilha) → precisa pular para alcançar a runa (superar obstáculo, fiero)"\n\nIdentifique: qual é o loop segundo a segundo? E o loop momento a momento ao longo de toda uma sessão? Como o estado de sucesso de uma mecânica ativa a próxima?'},
  {title:'Fase 3: Sinergia',
   body:'Sinergia é quando os loops ludonarrativos funcionam dentro do contexto maior do jogo — sistemas e level design sustentam e amplificam os loops.\n\nCada mecânica precisa de um ou mais sistemas que suportem sua narrativa. Se um sistema não suporta a narrativa de uma mecânica, ele cria dissonância.\n\nNovos sistemas e mecânicas devem ser avaliados sempre: "este novo elemento quebra algum loop existente? Cria conflito de contexto com outra mecânica?"'},
];

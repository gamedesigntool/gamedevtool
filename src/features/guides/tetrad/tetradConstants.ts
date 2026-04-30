export const CLR='#f59e0b';

export const ELEMENTS=[
  {id:'aesthetics', icon:'✨', label:'Aesthetics',  color:'#f472b6',
   diamond:'top',
   visibility:'player',
   tagline:'Tudo que o jogador vê, ouve e sente — a janela para a experiência',
   desc:'Estética é o elemento mais visível ao jogador: as imagens, sons, cheiros, sensações táteis e sabores que compõem a experiência sensorial. Para Schell, Aesthetics é o que o jogador encontra diretamente — é o rosto do jogo. Mudanças na estética afetam profundamente como as mecânicas são percebidas (o fog do Silent Hill era uma limitação técnica que virou mecânica E estética icônica).',
   subfields:[
     {key:'visual',    label:'Visual',    placeholder:'Paleta de cores, estilo de arte, perspectiva, UI/UX — o que os olhos veem. Qual é o mood visual dominante?'},
     {key:'audio',     label:'Áudio',     placeholder:'Trilha sonora, efeitos sonoros, voz — o que os ouvidos ouvem. Como o som reforça a atmosfera?'},
     {key:'feel',      label:'Game Feel', placeholder:'Feedback tátil, animações de impacto, "juice" — como o jogo SENTE ao tocar. Resposta física/háptica.'},
     {key:'style',     label:'Estilo Geral', placeholder:'Coerência estética geral: como visual + áudio + feel se unem em uma identidade reconhecível?'},
   ]},
  {id:'mechanics',  icon:'⚙️', label:'Mechanics',  color:'#fbbf24',
   diamond:'left',
   visibility:'partial',
   tagline:'As regras, procedimentos e sistemas que definem o que o jogador pode fazer',
   desc:'Mecânicas são os procedimentos e regras do jogo — o coração da interação. Schell identifica 6 tipos: Space (o espaço do jogo), Objects (ferramentas e entidades), Actions (o que o jogador pode fazer), Rules (o que é permitido/proibido), Skill (habilidades físicas/mentais/sociais exigidas) e Chance (aleatoriedade e incerteza). Mecânicas bem desenhadas parecem invisíveis — o jogador pensa no mundo do jogo, não nas regras.',
   subfields:[
     {key:'space',   label:'Space',   placeholder:'Como é o espaço do jogo? 2D, 3D, discreto (grades), contínuo? Quais são os limites e fronteiras do mundo jogável?'},
     {key:'objects', label:'Objects / Attributes', placeholder:'Quais são os objetos/entidades principais e seus atributos? (personagem, itens, inimigos, recursos...)'},
     {key:'actions', label:'Actions', placeholder:'O que o jogador pode fazer? Quais são as ações primárias e secundárias disponíveis?'},
     {key:'rules',   label:'Rules', placeholder:'Quais são as regras centrais? O que é permitido, proibido, penalizado? Como o jogo define vitória e derrota?'},
   ]},
  {id:'story',      icon:'📖', label:'Story',       color:'#34d399',
   diamond:'right',
   visibility:'partial',
   tagline:'A sequência de eventos e o mundo que contextualiza a experiência',
   desc:'Story é a sequência de eventos que se desdobra no jogo — pode ser pré-escrita pelo designer ou emergir da jogabilidade. Schell destaca que Story e Mechanics têm uma relação complexa e por vezes tensa: mecânicas criam liberdade (o jogador escolhe), mas narrativas lineares exigem controle (o designer dirige). O melhor design encontra formas de ambos coexistirem em harmonia. Nota: para jogos puramente abstratos (Tetris, Xadrez), Story pode ser mínima ou inexistente.',
   subfields:[
     {key:'world',      label:'Mundo / Setting',  placeholder:'Onde e quando o jogo se passa? Qual é a lore, a história do mundo, as regras do universo ficcional?'},
     {key:'characters', label:'Personagens',       placeholder:'Quem são os personagens principais? Protagonista, antagonista, NPCs relevantes — suas motivações e arcos.'},
     {key:'conflict',   label:'Conflito Central',  placeholder:'Qual é o conflito central que move a narrativa? O que está em jogo? O que o jogador/protagonista quer e o que o impede?'},
     {key:'emergence',  label:'Narrativa Emergente', placeholder:'Como as mecânicas criam histórias espontâneas? Que momentos emergentes o sistema possibilita? (ex: traições em Diplomacy, histórias de sobrevivência em Minecraft)'},
   ]},
  {id:'technology', icon:'🔧', label:'Technology',  color:'#818cf8',
   diamond:'bottom',
   visibility:'hidden',
   tagline:'Os recursos físicos/digitais que tornam o jogo possível — a fundação invisível',
   desc:'Technology é tudo que é usado para construir o jogo — desde papelão e dados até engines e consoles. Schell distingue dois tipos: Foundational Technology (torna novos tipos de experiência POSSÍVEIS — ex: o acelerômetro do iPhone abriu novos gêneros) e Decorational Technology (torna experiências existentes MELHORES — ex: gráficos mais detalhados). A tecnologia define os limites e as oportunidades de tudo o que é possível nas outras três dimensões.',
   subfields:[
     {key:'platform',  label:'Plataforma / Engine', placeholder:'Em qual plataforma o jogo roda? Qual engine ou tecnologia base? PC, console, mobile, browser, tabletop...'},
     {key:'foundational', label:'Technology Fundacional', placeholder:'Que tecnologia torna POSSÍVEL algo novo neste jogo que não seria possível de outra forma? O que isso habilita?'},
     {key:'constraints', label:'Restrições Técnicas',   placeholder:'Quais são as limitações técnicas que afetam o design? Como essas restrições moldam (ou até enriquecem) as escolhas criativas?'},
     {key:'delivery',  label:'Entrega ao Jogador',      placeholder:'Como o jogo chega ao jogador? Digital download, cartucho, kit tabletop, VR headset? Como a forma de entrega afeta a experiência?'},
   ]},
];

export const STEPS=[
  {id:'tech_mech',   label:'Fundação',   icon:'🔧', desc:'Technology + Mechanics'},
  {id:'story_aes',   label:'Experiência', icon:'✨', desc:'Story + Aesthetics'},
  {id:'harmony',     label:'Harmonia',    icon:'🎯'},
  {id:'compile',     label:'Compilar',    icon:'📄'},
];

export const GUIDE=[
  {title:'O Tetrad começa pela fundação',
   body:'Schell posiciona Technology na base do diamante por uma razão: ela define o que é possível. Antes de sonhar com estéticas deslumbrantes ou narrativas épicas, o designer precisa entender as capacidades e limitações da tecnologia disponível.\n\nMecânicas vêm logo acima: são os procedimentos e regras que a tecnologia viabiliza. O design eficiente começa perguntando "o que esta plataforma permite?" antes de "o que eu quero fazer?"\n\nExemplo clássico: o fog do Silent Hill nasceu de uma limitação do PS1 (não conseguia renderizar distância) — a tecnologia constrangeu a mecânica, que por sua vez criou a estética mais icônica da série.'},
  {title:'Story e Aesthetics — o que o jogador vê',
   body:'Story e Aesthetics são as camadas mais visíveis ao jogador. Aesthetics fica no topo do diamante porque é o ponto de contato direto: o jogador vê, ouve e sente antes de entender as regras.\n\nStory é o contexto que dá significado às mecânicas. Sem narrativa, uma mecânica de "apertar botão para sobreviver" é exercício; com narrativa, é tensão dramática.\n\nA relação Story ↔ Mechanics é a mais complexa do Tetrad. Mecânicas criam liberdade de escolha; narrativas lineares exigem controle. O designer resolve essa tensão com "narrative mechanics" — sistemas que criam espaço para emergência dentro de uma estrutura dirigida.'},
  {title:'Harmonia — "Holographic Vision"',
   body:'O conceito central do Elemental Tetrad não é que os 4 elementos existam — é que eles trabalhem em HARMONIA, reforçando um tema comum.\n\nSchell chama isso de "Holographic Vision": a capacidade do designer de ver simultaneamente todas as 4 perspectivas e como elas se afetam mutuamente. Cada decisão em uma dimensão tem consequências nas outras três.\n\nPergunta de ouro: "Como cada elemento reforça o tema central do jogo?" Se a resposta for fraca em qualquer dimensão, há dissonância — e o jogador vai sentir, mesmo sem saber nomear o problema.\n\nTheme é a cola que une o Tetrad. Schell cita Pirates of the Caribbean como exemplo: cada elemento (mecânicas de combate naval, narrativa de piratas, estética de época, tecnologia de realidade virtual imersiva) servia ao mesmo tema central.'},
];

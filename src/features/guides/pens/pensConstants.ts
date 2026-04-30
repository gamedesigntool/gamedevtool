export const CLR='#818cf8';

export const COMPONENTS=[
  {id:'competence', icon:'⚡', label:'Competence',       color:'#fbbf24',
   sdt:true,
   tagline:'Sentir-se eficaz, capaz e progressivamente melhor',
   desc:'Competência é a necessidade intrínseca de se sentir eficaz no que se faz. Jogos satisfazem essa necessidade quando oferecem desafios calibrados — nem fáceis demais (tédio) nem difíceis demais (frustração). O feedback claro e consistente é o veículo da competência: o jogador precisa saber que suas ações importam e que ele está melhorando.',
   designHints:['Curva de dificuldade que escala com a habilidade do jogador','Feedback imediato e legível sobre o resultado das ações','Sistemas de mastery visível (níveis, estatísticas, recordes pessoais)','Checkpoints que validam o progresso sem trivializar o desafio'],
   testItems:['Senti que estava ficando bom neste jogo conforme joguei.','Senti que era muito competente enquanto jogava.','As habilidades que usei no jogo combinaram bem com os desafios que encontrei.','Alcancei objetivos do jogo com sucesso.','"Notei que minha habilidade no jogo melhorou ao longo do tempo.']},
  {id:'autonomy',   icon:'🧭', label:'Autonomy',         color:'#34d399',
   sdt:true,
   tagline:'Liberdade de escolha, volição e agência real',
   desc:'Autonomia é a necessidade de sentir que as ações são autodeterminadas — que as escolhas partem de valores e interesses genuínos, não de pressão externa. Em games, isso se manifesta como opções reais de jogo: múltiplos caminhos, estratégias variadas, personalização de objetivos. Jogadores com alta satisfação de autonomia jogam por prazer intrínseco, não por compulsão.',
   designHints:['Múltiplos caminhos ou estratégias para o mesmo objetivo','Personalização de personagem, estilo de jogo ou progressão','Opções de dificuldade que respeitam a escolha do jogador','Missões secundárias e exploração livre sem punição por desviar'],
   testItems:['Senti que minhas escolhas no jogo refletiam o que eu realmente queria fazer.','Senti pressão para fazer coisas no jogo que não queria. (inverso)','O jogo me deixou jogar do jeito que eu queria.','Senti que podia explorar o jogo do meu próprio jeito.']},
  {id:'relatedness',icon:'💞', label:'Relatedness',      color:'#f472b6',
   sdt:true,
   tagline:'Conexão, pertencimento e vínculos com personagens/jogadores',
   desc:'Relatedness é a necessidade de se sentir conectado a outros — de importar-se com as pessoas (ou personagens) e ser correspondido. Em games, surge tanto nas relações com NPCs e narrativa quanto com outros jogadores. Estudos mostram que jogadores de MMOs que satisfazem relatedness têm engajamento mais duradouro e bem-estar pós-jogo mais positivo.',
   designHints:['NPCs com personalidade e arcos que o jogador pode influenciar','Cooperação genuína onde o sucesso depende de colaboração','Comunidade, guilds, ou sistemas de amizade com recompensas relacionais','Narrativa com personagens pelos quais o jogador desenvolve empatia'],
   testItems:['Senti que os personagens no jogo se preocupavam comigo.','Me senti conectado com outros (personagens ou jogadores) durante o jogo.','Senti que havia pessoas no jogo com quem eu me importava.','Me senti sozinho no jogo. (inverso)']},
  {id:'controls',   icon:'🎮', label:'Intuitive Controls', color:'#a78bfa',
   sdt:false,
   tagline:'Interface dominada com fluidez — o jogo responde como o corpo pensa',
   desc:'Controles Intuitivos é um componente gaming-specific adicionado ao PENS por Ryan & Rigby. Diferente de Competência (que é sobre masteriar os desafios do jogo), Controles Intuitivos mede se a interface em si é fluida e transparente — se o jogador consegue executar suas intenções sem que a interface se torne um obstáculo. Em validações posteriores (Johnson et al., 2018), Competência e Controles Intuitivos correlacionam fortemente, sugerindo que na prática são difíceis de separar.',
   designHints:['Mapeamento natural entre intenção e ação (apertar A para pular, não para rolar)','Curva de aprendizado de controles suave com tutoriais contextuais','Consistência de controles ao longo de todo o jogo','Feedback de controle (resistência, som, haptics) que confirma a ação'],
   testItems:['Quando queria fazer algo no jogo, era fácil lembrar o controle correspondente.','Os controles do jogo eram fáceis de aprender.','Me senti no controle das ações do personagem.','A interface do jogo não atrapalhava minha experiência.']},
  {id:'presence',   icon:'🌌', label:'Presence',          color:'#22d3ee',
   sdt:false,
   tagline:'Imersão física, emocional e narrativa no mundo do jogo',
   desc:'Presence (Imersão) é o segundo componente gaming-specific do PENS, medido em 3 dimensões: (1) Física — sensação de "estar lá", de habitar o espaço do jogo; (2) Emocional — respostas afetivas genuínas ao que acontece na ficção; (3) Narrativa — absorção na história, curiosidade sobre o que vem a seguir. Jogos com alta Presence criam o que Csikszentmihalyi chama de flow — a fusão do jogador com a atividade.',
   designHints:['Ambiente visual e sonoro que sustenta a sensação de "estar lá" (física)','Personagens e situações que geram respostas emocionais autênticas (emocional)','Narrativa que faz o jogador querer saber o que acontece a seguir (narrativa)','Minimizar elementos que "quebram" a imersão (UI intrusiva, bugs, inconsistências)'],
   testItems:['Senti que estava realmente dentro do mundo do jogo.','O jogo me fez sentir emoções como se o que acontecia fosse real.','Me peguei pensando "o que vai acontecer a seguir" enquanto jogava.','Esqueci o tempo enquanto jogava — fiquei completamente absorto.']},
];

export const STEPS=[
  {id:'sdt',      label:'Necessidades SDT',   icon:'🧠'},
  {id:'gamespc',  label:'Controls & Presence', icon:'🎮'},
  {id:'playtest', label:'Playtest Guide',     icon:'🔬'},
  {id:'compile',  label:'Compilar',           icon:'📄'},
];

export const GUIDE=[
  {title:'PENS e a Self-Determination Theory',
   body:'PENS é fundamentado na Self-Determination Theory (SDT) de Deci & Ryan — uma das teorias de motivação mais robustas da psicologia. SDT propõe que existem 3 necessidades psicológicas universais cuja satisfação é preditora de bem-estar, motivação intrínseca e engajamento.\n\nA grande contribuição de Ryan, Rigby & Przybylski (2006): demonstraram empiricamente que jogos populares satisfazem essas necessidades de forma mais eficaz que jogos mal avaliados — mesmo quando controlando por gênero, gráficos e outros fatores.\n\nDesafio central para o designer: as 3 necessidades precisam ser satisfeitas em conjunto. Um jogo muito desafiante mas sem autonomia frustra. Um jogo com muita liberdade mas sem feedback de competência desortienta.'},
  {title:'Controls & Presence — o que os games adicionam',
   body:'Além das 3 necessidades SDT universais, Ryan & Rigby identificaram 2 dimensões específicas para games:\n\nControles Intuitivos: a interface deve ser tão fluida que se torna transparente — o jogador pensa e o jogo responde. Quando os controles falham, toda a satisfação de competência e autonomia é sabotada na camada mais básica.\n\nPresença: imersão em 3 camadas — física (estar no espaço), emocional (sentir com os personagens), narrativa (querer saber o que vem). Jogos com alta Presence criam experiências memoráveis que jogadores descrevem como "transformadoras".\n\nNota de pesquisa: Johnson et al. (2018) encontraram que Competence e Intuitive Controls correlacionam fortemente na prática — no design, é útil pensá-los separados, mas no playtest eles tendem a andar juntos.'},
  {title:'Playtest com PENS — design e medição',
   body:'O diferencial único do PENS entre todos os frameworks de game design: é também um instrumento de medição validado. Depois de construir o jogo (ou um protótipo), você pode aplicar as questões PENS em sessões de playtest para verificar se cada necessidade está sendo satisfeita.\n\nComo usar: peça ao playtester que avalie de 1 (discordo totalmente) a 7 (concordo totalmente) cada item após a sessão. Scores abaixo de 4 indicam necessidade não satisfeita — área prioritária para redesign.\n\nDica de iteração: identifique qual componente tem score mais baixo e busque especificamente qual mecânica ou momento de jogo está falhando nessa necessidade.'},
];

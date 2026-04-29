export const CLR='#22d3ee';

export const PRIMARIES=[
  {id:'toy',     icon:'🎮', label:'Toy',      color:'#e85d9b',
   tagline:'O aspecto sensorial e tátil do jogo',
   desc:'Toy são as coisas com que você joga. É o aspecto tátil e audiovisual: correr e pular, mirar e atirar. O feedback de som, partículas, física, vibração. Toy é sua interface para o bom momento — o prazer sensorial direto da interação.',
   questions:['Quais ações físicas o jogador realiza momento a momento?','Que feedback audiovisual reforça cada ação?','O que torna a interação em si prazerosa, independente do objetivo?']},
  {id:'fantasy', icon:'🌟', label:'Fantasy',  color:'#e85d9b',
   tagline:'A ficção e o aspecto aspiracional do jogo',
   desc:'Fantasy é a ficção em que você está imerso. O aspecto aspiracional: salvar o mundo, ser um campeão, construir um lar. Não precisa ser narrativa — Tetris é sobre controlar o caos; Chess é sobre superar outro intelecto. Fantasy é o que te atrai com a promessa de significado fora da vida cotidiana.',
   questions:['Qual é o papel aspiracional do jogador dentro do jogo?','Que mundo ou situação o jogo simula?','O que o jogador "é" ou "representa" dentro da ficção?']},
  {id:'tension', icon:'⚡', label:'Tension',  color:'#e85d9b',
   tagline:'O conflito e desafio que conferem peso à atividade',
   desc:'Tension é o que te desafia. Jogos, como histórias, dependem do conflito para criar significado. Uma bola sozinha é um toy — mas ganha gravidade quando você adiciona tension: precisa acertar o gol, não pode usar as mãos, tem um adversário, há um limite de tempo. Tension habilita o flow e é responsável pela percepção de diversão.',
   questions:['Qual é o conflito central do jogo?','O que impede o jogador de atingir o objetivo facilmente?','Como tension cria urgência e significado nas ações?']},
  {id:'progress', icon:'📈', label:'Progress', color:'#e85d9b',
   tagline:'O crescimento e o horizonte para o qual o jogador avança',
   desc:'Progress é o que te faz crescer. Fornece um horizonte para olhar adiante: vencer cenários, subir de nível, desbloquear habilidades. Progress faz o jogo se expandir e variar conforme a experiência do jogador evolui — é o que faz a primeira hora ser diferente da centésima.',
   questions:['Como o jogador cresce ou muda ao longo do tempo?','Que sistemas de progressão existem (xp, unlocks, habilidades)?','Como a experiência da hora 1 difere da hora 10 ou 100?']},
];

export const SECONDARIES=[
  {id:'struggle', icon:'⚔️', label:'Struggle', color:'#f59e0b', parents:['toy','tension'],
   tagline:'Toy × Tension — o core gameplay minuto a minuto',
   desc:'Struggle é o toy da tension — o "core gameplay". São os problemas minuto a minuto que o jogador precisa resolver para avançar. Combina o sensorial com o desafio: chutar uma bola para marcar gol, mirar e atirar para matar monstros, esconder para não ser visto, desviar para não ser atingido. É o primeiro aspecto concreto que designers iniciantes precisam dominar.',
   questions:['Qual é a ação central repetida que o jogador executa?','Como Struggle combina feedback sensorial (Toy) com desafio (Tension)?','O que o jogador faz concretamente para superar cada obstáculo?']},
  {id:'risk',    icon:'☠️', label:'Risk',     color:'#f59e0b', parents:['fantasy','tension'],
   tagline:'Fantasy × Tension — o que o jogador teme na ficção',
   desc:'Risk é a fantasy da tension — a Espada de Dâmocles do jogador. É o que ele teme emocionalmente dentro da ficção do jogo: ser capturado pelo monstro, perder o torneio, ficar sem recursos, morrer. Risk mantém o jogador alerta e motivado para melhorar. Só pode ser enfrentado através de Struggle.',
   questions:['O que o jogador teme perder ou que consequência quer evitar?','Como Risk está expresso dentro da ficção do jogo?','Qual é o "pior cenário" que mantém o jogador em alerta?']},
  {id:'purpose', icon:'🎯', label:'Purpose',  color:'#f59e0b', parents:['fantasy','progress'],
   tagline:'Fantasy × Progress — o que o jogador almeja na ficção',
   desc:'Purpose é a fantasy do progress — o que o jogador almeja na ficção do jogo, os símbolos de crescimento. Ficar mais forte como guerreiro, explorar um novo planeta, resolver um mistério, construir um lar aconchegante. Purpose eleva o meio: fornece contexto e impulso, transformando artefatos abstratos em motivação e arcos pessoais.',
   questions:['Qual é o objetivo maior do jogador dentro da ficção?','Como Progress é simbolizado narrativamente?','O que o jogador "se torna" ao completar o jogo?']},
  {id:'reward',  icon:'🏆', label:'Reward',   color:'#f59e0b', parents:['toy','progress'],
   tagline:'Toy × Progress — o que o jogador ganha pelas suas ações',
   desc:'Reward é o toy do progress — o que o jogador ganha ao completar os desafios. Enquanto Purpose é aspiracional, Rewards são tangíveis: nova habilidade ou power-up, item, recurso, acesso a uma área, colecionável, opção cosmética. Podem ser puramente audiovisuais: um boss explodindo em mil pedaços, aldeões celebrando o retorno do herói.',
   questions:['Quais são as recompensas tangíveis por completar desafios?','Como Reward reforça sensorialmente a sensação de progresso?','Há variedade de tipos de recompensa (itens, cosméticos, acesso, audiovisual)?']},
];

export const STEPS=[
  {id:'primary',   label:'Cores Primárias',   icon:'🎨'},
  {id:'secondary', label:'Cores Secundárias',  icon:'🔀'},
  {id:'structure', label:'Structure',         icon:'🔄'},
  {id:'compile',   label:'Compilar',          icon:'📄'},
];

export const GUIDE=[
  {title:'As 4 Cores Primárias de Game Design',
   body:'Dal Molin propõe que todo jogo tem 4 elementos fundamentais — as cores primárias — sempre presentes em alguma proporção:\n\n🎮 Toy é sensorial: o prazer direto da interação.\n🌟 Fantasy é simbólico: o significado aspiracional.\n⚡ Tension te puxa de volta: o conflito que cria urgência.\n📈 Progress te empurra adiante: o crescimento que sustenta o jogo.\n\nA chave é garantir que todos os 4 estejam "confortáveis, bem alimentados e conversando entre si". Documente cada cor com exemplos concretos do seu jogo.'},
  {title:'As 4 Cores Secundárias — Intersecções',
   body:'Misturando as cores primárias surgem funções específicas que o designer precisa monitorar de perto:\n\n⚔️ Struggle = Toy × Tension (core gameplay)\n☠️ Risk = Fantasy × Tension (o que o jogador teme)\n🎯 Purpose = Fantasy × Progress (o que almeja na ficção)\n🏆 Reward = Toy × Progress (o que ganha pelas ações)\n\nO erro clássico de design: focar apenas em Struggle e esquecer Purpose — o gameplay fica tecnicamente funcional mas vazio de significado. Cada cor secundária depende de ambas as primárias que a formam.'},
  {title:'Structure — o centro da roda',
   body:'Structure é o "designing principle" do jogo — como John Truby chama na Anatomia da História. É a organização responsável por expor o jogador ao Risk, instalar o senso de Purpose, fazê-lo Struggle e oferecer Rewards.\n\nExemplos: níveis lineares em série, open-world com quests, uma única casa para explorar no próprio ritmo, playthrough repetível com desafios aleatórios.\n\nNão existe uma estrutura certa — existe a estrutura certa para o seu jogo. Dal Molin não enfatiza o suficiente: encontrar a Structure errada pode destruir um design perfeito nas outras 8 cores.'},
];

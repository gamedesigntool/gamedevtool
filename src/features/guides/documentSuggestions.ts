export function getSuggestions(moduleId: string, project: { name: string }, docTitle: string){
  const n=project.name,t=docTitle;
  const map: Record<string, string[]> = {
    mechanics:    ['Explique detalhadamente como funciona "'+t+'"','Quais edge cases "'+t+'" precisa prever?','Como "'+t+'" se equilibra com o resto do jogo de '+n+'?'],
    characters:   ['Desenvolva a ficha completa de "'+t+'"','Qual é o arco de transformação de "'+t+'"?','Crie as motivações e medos de "'+t+'"'],
    worldbuilding:['Expanda a história e as facções de "'+t+'"','Que conflitos políticos moldam "'+t+'"?','Como "'+t+'" conecta ao conflito central do '+n+'?'],
    leveldesign:  ['Projete o layout e desafios de "'+t+'"','Quais mecânicas "'+t+'" deve explorar?','Como guiar o jogador por "'+t+'" organicamente?'],
    flowcharts:   ['Mapeie o fluxo completo de "'+t+'"','Quais são os nós de decisão em "'+t+'"?','Crie os estados e transições de "'+t+'"'],
  };
  return map[moduleId]||['Desenvolva "'+t+'"','Expanda as ideias de "'+t+'"','Conecte "'+t+'" ao restante do projeto'];
}

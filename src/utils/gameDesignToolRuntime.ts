export const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export const uid = () => Math.random().toString(36).slice(2, 9);

export const todayStr = () => new Date().toLocaleDateString('pt-BR');

# Plano de melhoria visual — JobWatch

Diagnóstico e passo a passo do redesign do frontend, feito para tirar a "cara de IA" da interface: tipografia genérica grande demais, paleta de cores que não conversa entre si, superfícies chapadas e uma logo sem significado. Este documento é o guia; as mudanças já foram implementadas na mesma leva.

## 1. Diagnóstico (o que gritava "gerado por IA")

1. **Paleta "Material Theme Builder" padrão** — primária verde-menta neon (`#4edea3`), secundária azul-ciano neon (`#4cd7f6`) e terciária laranja (`#ffb95f`) sobre um fundo escuro **azulado/lavanda** (`#0f131c`). Três tons neon competindo entre si, sentados num fundo de temperatura de cor diferente (frio) da dos acentos (quentes) — é essa incompatibilidade de temperatura que dá a sensação de "não combina".
2. **Tipografia grande e genérica demais** — `text-display` de 56px, `text-headline-lg` de 36px, tudo em Plus Jakarta Sans + Inter, a dupla de fontes mais usada em geradores de UI por IA. Títulos gigantes em cards pequenos, sem hierarquia de peso real.
3. **Superfícies "chapadas"** — todo cartão é `rounded-xl` + `bg-surface-container-low` + `shadow-md`, sem variação de tratamento entre hero, card de dado e item de lista. Nenhuma borda, textura ou profundidade real — só cor sólida.
4. **"Glow" neon em botões** — `shadow-[0_0_15px_-3px_rgba(78,222,163,0.3)]` repetido em botões primários por todo o app. É um tique visual muito comum em telas geradas por IA (o botão "brilha" sem motivo).
5. **Blobs de gradiente borrado** — círculos `blur-3xl`/`blur-2xl` decorativos nos heroes (Dashboard, AuthLayout) — outro clichê de "hero de SaaS gerado".
6. **Excesso de caixa-alta com tracking largo** (`text-label-caps`) em todo rótulo, mesmo onde não ajuda a hierarquia.
7. **Logo sem significado** — quadrado com um círculo tracejado (órbita), um ponto central e 4 tracinhos tipo mira. É um ícone abstrato genérico de "app de tech", sem relação com "monitorar vagas".
8. **Pouca densidade de informação real** — os cards de vaga mostram pouco além do que já é texto; a "decoração" ocupa o espaço que poderia ser usado por mais dado útil (badges de rota, horário, distância, etc.), o que faz o layout parecer bonito-vazio em vez de rico-funcional.

## 2. Direção nova

- **Paleta**: manter os 3 papéis semânticos (verde = marca/sucesso, azul = informação, âmbar = atenção) mas aprofundar/dessaturar os tons neon para versões mais "joia" (menos açucaradas) e **trocar a base neutra de azulada/lavanda para grafite quente/papel quente**, para que os acentos e o fundo tenham a mesma temperatura de cor. Isso resolve o "não combina" sem precisar reaprender uma marca nova.
- **Tipografia**: trocar a fonte de título de *Plus Jakarta Sans* para **Space Grotesk** (mais carácter, look mais técnico/radar) mantendo *Inter* no corpo e *JetBrains Mono* nos dados — e **reduzir a escala** (títulos ~20% menores) para um tom mais editorial e menos "banner".
- **Superfícies**: dar aos cards uma borda sutil (1px, baixo contraste) + sombra neutra de elevação (em vez de brilho colorido), com uma pequena "aresta" superior nos cards de destaque. Trocar blobs borrados por um padrão de grade/radar sutil (temático, já que o app literalmente faz "radar de vagas").
- **Logo**: nova marca com significado — uma lupa (busca) com um pulso de radar saindo dela (monitoramento contínuo), em vez do ícone abstrato tracejado.
- **Densidade**: cards de vaga e busca ganham mais linhas de metadado (turno, distância, tempo de publicação, correspondência) organizadas em grade, reforçando a sensação de painel funcional.

## 3. Passo a passo executado

1. **Fontes** (`frontend/index.html`) — trocado Plus Jakarta Sans por Space Grotesk nos `<link>` do Google Fonts.
2. **Tokens de cor e tipografia** (`frontend/src/index.css`) — reescritos `:root` e `.dark`: neutros grafite/papel quentes, verde/azul/âmbar aprofundados e harmonizados, nova escala tipográfica menor, novas classes utilitárias de sombra de elevação (`.shadow-elevation-*`) e sombra de acento (`.shadow-accent-*`) para substituir os glows neon hardcoded.
3. **Logo** (`frontend/src/components/brand/Logo.tsx`) — novo símbolo lupa + pulso de radar, usando variáveis CSS (`var(--jw-primary)` etc.) em vez de checagem de tema via JS.
4. **Botão** (`components/ui/Button.tsx`) — removido o glow neon; nova elevação sutil + `brightness`/estados de hover mais discretos; variantes revisadas.
5. **Card, Badge, Input, Select, Modal, EmptyState, Skeleton, Switch** — bordas sutis, sombras neutras, cantos e paddings consistentes.
6. **Sidebar / Header / AppLayout / AuthLayout** — glows e blobs trocados por texturas discretas; subtítulo "AMZN Engine" trocado por algo com significado ("Radar de Vagas"); uso da nova logo.
7. **Dashboard** — hero reconstruído sem blobs (grade de radar sutil), métricas com mais contexto, cards de vaga com grade de metadados adicional, remoção dos glows.
8. **Jobs / Searches** — mesmos ajustes pontuais de glow/blob e alinhamento ao novo sistema de cor (a maior parte herda automaticamente via tokens).
9. **Telas de auth (Login/Register/Forgot)** — herdam a paleta/tipografia nova automaticamente; ajustes finos de contraste onde necessário.

## 4. Próximos passos sugeridos (não incluídos nesta leva)

- Aplicar o mesmo tratamento de "grade de metadados" às páginas de detalhe (`JobDetails`, `SearchDetails`) e ao formulário `SearchNew`.
- Considerar dark/light toggle com transição suave de cor (atualmente é instantâneo).
- Revisar ilustrações do `EmptyState` — hoje é só um ícone; um desenho simples de "radar" reforçaria a identidade.

## 5. Rodada 2 — referências (`referências/Novo Design`) + apple.com

A pasta `referências/Novo Design` continha um brief completo (`DESIGN.md` + telas `screen.png`/`code.html`) chamado "JobWatch" (dark) e um segundo chamado "Precision Logistics Radar" (light). **Importante**: ao conferir, os tokens de cor e a logo desses briefs são exatamente os originais que a Rodada 1 substituiu (verde-menta neon `#4edea3`, fundo azulado `#0f131c`, logo com círculo tracejado) — ou seja, é o mesmo design "gerado por IA" que você pediu para eu tirar da tela, não um novo alvo de cor/marca. Por isso, aproveitei dessas referências apenas as **ideias estruturais e de função** (o visual/paleta continua o da Rodada 1). Do site da Apple, apliquei o princípio de **hierarquia por contraste e reducionismo** (poucos elementos, ações primárias bem demarcadas, toques suaves) em vez de conteúdo literal (é um site institucional, não um dashboard).

O que foi implementado:

1. **Logo simplificada** (`components/brand/Logo.tsx`) — troquei a lupa+pulso por uma mira/escopo (círculo + 4 marcas cardeais + ponto central), mais próxima do ícone de "radar" das referências, porém redesenhada do zero com as cores do nosso tema (não os hex originais) e bem mais reduzida (4 elementos, lê melhor em 16–20px).
2. **Botões primários viraram pílula** (`rounded-full`) — `Button` (variant `primary`), "Nova Busca", "Forçar Varredura/Verificação", "Candidate-se Agora" (todas as ocorrências) e os CTAs de estado vazio. Ações secundárias/utilitárias (Excluir, Marcar como visualizada) continuam retangulares — segue o padrão da Apple de reservar a pílula para a ação principal.
3. **Micro-interação de toque** — `active:scale-[0.97]` em todos os botões (feedback tátil sutil ao clicar, como em iOS).
4. **Ícone preenchido no item ativo da navegação** (`Sidebar.tsx`) — outline quando inativo, preenchido (`filled`) quando selecionado, replicando o padrão de tab bar da Apple/SF Symbols. Corrigido também um bug onde o ícone de "Configurações" nunca ficava com a cor de destaque ao navegar até lá.
5. **Cantos mais generosos nas superfícies grandes** (`rounded-2xl`) — `Card`, `EmptyState`, hero do Dashboard, hero da vaga (`JobDetails`), card de vaga em destaque e o painel *Inspector* — cantos pequenos (badges, chips) continuam com raio menor, criando hierarquia de dois níveis.
6. **Painéis flutuantes com vidro** — a bandeja de notificações (`NotificationTray`) e os modais (`Modal`, `NewSearchFrame`) ganharam `backdrop-blur` + leve transparência, em vez de fundo sólido chapado.
7. **Botão de compartilhar real** (`components/jobs/ShareJobButton.tsx`) — usa a Web Share API nativa (com fallback de copiar link) para compartilhar o link real da vaga (Amazon), disponível no card do Dashboard, no feed de Vagas, no painel Inspector e na página de detalhes da vaga.
8. **Dado real de cobertura nos cards de busca** — Dashboard e página de Monitoramentos agora mostram as cidades adicionais reais (`search.additionalCities`) na linha de localização, e o indicador de status usa `StatusBadge`/cor de erro corretamente (antes, um monitoramento com `ERROR` aparecia com a mesma cor de "pausado").

O que **não** foi copiado das referências, por exigir dados que o backend ainda não expõe (teria que ser inventado): telemetria de proxy/DNS, latência de scraping por request, logs HTTP por execução, integrações de webhook/Telegram, 2FA e lista de sessões/dispositivos. Se algum desses vier a existir no backend, a tela "Monitoramentos" já tem o `Histórico de Execuções` como o lugar certo para estender.

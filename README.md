# ⚓ Naveo - Central de Gestão Estratégica (CRM, Projetos & IA)

Bem-vindo à evolução do **Naveo**, um ecossistema de gestão de alta performance,
desenhado com estética premium "Deep Sea" e inteligência artificial nativa para
impulsionar a produtividade estratégica.

O sistema foi arquitetado para ser uma verdadeira "Fonte Única de Verdade" para
o seu negócio, conectando CRM, faturamento, projetos e fluxo de trabalho em
tempo real.

---

## 🚀 Tecnologias de Ponta

- **Framework**: [Astro 5.0](https://astro.build/) (Arquitetura de ilhas).
- **Interface**: [React 19](https://react.dev/) para componentes dinâmicos.
- **Inteligência Artificial**: Integração nativa com **OpenAI** (Netuno).
- **Estilo**: [Tailwind CSS 4.0](https://tailwindcss.com/) com design
  "Glassmorphism" customizado.
- **Visualização de Dados**: [Recharts](https://recharts.org/) para BI e
  gráficos dinâmicos.
- **Backend & Realtime**: [Supabase](https://supabase.com/) com PostgreSQL.
- **Interatividade**: [@dnd-kit](https://dnd-kit.com/) para sistema Kanban
  fluido (Drag & Drop).

---

## ✨ Principais Recursos e Módulos

### 🤖 1. Netuno AI (Assistente Estratégico)

O **Netuno** não é apenas um chat. É o cérebro integrado do sistema:

- **Investigação de Mercado**: Pesquisa automática de leads com um clique.
- **Geração de Dossiês**: Cria relatórios detalhados baseados em conversas.
- **Comandos de Voz**: Integração com Web Speech API para ditado.
- **Diário de Bordo**: Persistência de sessões estratégicas (salvas
  no Supabase).

### 📊 2. Dashboard Financeiro Dinâmico

O cérebro financeiro do seu negócio:

- **Gráficos em Tempo Real**: O faturamento dos últimos 6 meses é calculado
  **automaticamente** puxando do CRM (Leads marcados como "Fechado").
- **Métricas Globais**: Visão rápida de Recebido vs. Pendente, Projetos Ativos
  e Retenção de Clientes.
- **Live Updates**: Atualiza na tela do usuário no exato momento que um negócio
  é fechado (via Supabase Realtime).

### 📈 3. CRM Inteligente

Gestão de relacionamento de ponta a ponta:

- **Funil de Vendas (Kanban)**: Acompanhamento visual de leads com edição rápida
  e campos ricos (Interesse, Valor Estimado, E-mail, Telefone).
- **Integração Global**: Converte oportunidades ganhas e envia dados diretamentamente
  para o pipeline financeiro.
- **Gestão de Clientes**: Base centralizada com histórico de interações.

### ✅ 4. Central de Projetos & Tarefas

Gestão de fluxo de trabalho voltada a entregas rápidas:

- **Painel Kanban Fluído**: Arraste e solte tarefas entre status (Backlog,
  Fazendo, Revisão, Concluído).
- **Anotações Inteligentes (Auto-Save)**: O campo de Notas de Projeto salva
  automaticamente enquanto você digita ou ao fechar o painel, impedindo
  qualquer perda de dados.
- **Atribuição Flexível**: Designação clara de membros da equipe para cada tarefa,
  com persistência perfeita no banco.

### 📅 5. Timeline & Agenda

Uma visão 360º de todos os prazos e marcos:

- **Visões Flexíveis**: Tripla visualização (Mês, Semana e Dia).
- **Identificação Automática**: Tarefas e feriados cruzados para antecipar
  gargalos.

---

## 🛡️ Segurança e Governança

O Naveo utiliza arquitetura de segurança de nível corporativo através do Supabase:

- **Row Level Security (RLS)**: Isolamento granular de dados. Nenhuma empresa
  enxerga dados de outra.
- **Controle de Acesso (RBAC)**: Visibilidade sob medida entre as roles `admin`,
  `super_admin` e `user` (Membros veem apenas projetos da própria equipe).

---

## 🛠️ Configuração e Instalação

1. **Clone o Repositório** e instale as dependências:

   ```bash
   npm install
   ```

2. **Configuração do Banco (Supabase)**:
   - Certifique-se de executar as tabelas fundamentais (`profiles`, `clientes`,
     `projetos`, `tasks`, `leads`, `sys_notifications`).
   - Garanta que a tabela `tasks` tenha a coluna `description` habilitada. (Veja
     `supabase_add_description.sql`).

3. **Variáveis de Ambiente**:

   Crie um arquivo `.env` na raiz do projeto contendo:

   ```env
   PUBLIC_SUPABASE_URL=seu_url
   PUBLIC_SUPABASE_ANON_KEY=sua_key
   OPENAI_API_KEY=sua_key_da_openai
   ```

4. **Inicie o Servidor de Desenvolvimento**:

   ```bash
   npm run dev
   ```

   Acesse a aplicação em: `http://localhost:4321`

---

**Desenvolvido para ser a bússola definitiva na gestão de negócios modernos.**

⚓ _Naveo - Navegando na complexidade, entregando clareza._

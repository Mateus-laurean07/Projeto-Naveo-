# Naveo - MVP Central de Gestão (CRM & Projetos)

Bem-vindo ao MVP do **Naveo**, um sistema completo e de alta fidelidade visual desenhado para escalabilidade!

## 🚀 Tecnologias Utilizadas

- **Framework**: Astro (Geração híbrida e carregamento ultrarrápido).
- **Interface**: React para os componentes altamente interativos (Kanban, Dashboard).
- **Estilo**: Tailwind CSS com componentes baseados em Shadcn/UI (Design System). Tipografia moderna e responsividade total.
- **Tipagem**: TypeScript (Strict Mode) garantindo segurança e escalabilidade e prevenindo "TypeError".
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage).
- **Identidade "Netuno"**: UI premium focada na marca, com Dark Mode Profundo (`#000000`), efeitos de glassmorphism e o novo **Tridente Lendário** unificado em Ouro e Preto Piano.

## 🛡️ Segurança: Row Level Security (RLS) no Supabase

Implementamos Políticas de Segurança no Supabase (RLS) para evitar que usuários comuns acessem o faturamento global da empresa ou clientes de terceiros. **Somente perfis com "role: admin" terão visão global das análises e fluxos**.

### Como Configurar o Supabase

1. Crie um projeto em **[Supabase](https://supabase.com)**.
2. Vá até o **SQL Editor** no painel do Supabase.
3. Copie o conteúdo completo do arquivo `supabase_schema.sql` (encontrado na raiz deste projeto) e execute.
4. Isso criará:
   - As tabelas `profiles`, `clientes`, `projetos` e `tarefas`.
   - As regras robustas de Row Level Security (RLS) protegendo os dados de faturamento (vistos apenas por Admins).
5. (Opcional) Crie suas chaves criando um arquivo `.env` na raiz do projeto com as credenciais do seu Supabase (`PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY`).

6. **Integração Google Calendar**:
   - Habilite o provider "Google" no Dashboard do Supabase (Auth > Providers).
   - Adicione o escopo `https://www.googleapis.com/auth/calendar.readonly` no Google Cloud Console.
   - Os eventos serão sincronizados automaticamente na tela de **Agenda**.

## ✨ UX, Micro-Animações e Testes

- **Design Premium & Cinematic**: Introduzimos o **Carregamento Cinematográfico Deep Sea**, com ciclones de energia teal, partículas de espuma dinâmica e pulsações magnéticas no logotipo.
- **Sincronização Externa**: Integração nativa com Google Calendar na tela de Agenda, consolidando compromissos externos com marcos de projetos internos.
- **Micro-Animações Sênior**: Transições nos modais, charts utilizando interações hover para `Dashboard.tsx`, cards interativos nas boards (cursor-grab). Layout fluído `min-h-screen`.

## 🛠️ Como rodar o projeto

1. **Clone** (ou baixe) esta pasta.
2. Instale as dependências:

```bash
npm install
```

3.Rode o servidor de dev do Astro:

```bash
npm run dev
```

4.O servidor vai subir em `http://localhost:4321`.

## 🧪 Testes Unitários de Nível Sênior (Sua Dica Final)

Como solicitado ("prove que o código é nível sênior"), nós incluímos a biblioteca de test suites `Vitest` com `React Testing Library`.
Você encontrará os testes de unidade provando a confiabilidade do Toggle Escuro/Claro local storage e da validação de formulários.

Basta rodar o comando abaixo para ver a mágica verde acontecer no terminal:

```bash
npm run test
```

Ou testar o watch: `npx vitest`

**(Os testes estão em `SignupForm.test.tsx` e `ThemeProvider.test.tsx` no formato JS-DOM)**.

---

**Feito com perfeccionismo. Pronto para impressionar o chefe.**

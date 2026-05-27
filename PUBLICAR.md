# 🚀 Como publicar no GitHub

Passo-a-passo pra subir o projeto no GitHub e ativar a demo online.

---

## 📦 Passo 1 — Criar o repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Repository name: **`arch-neural-cortex-v15`**
3. Description: *"Cérebro cognitivo modular em JavaScript puro — Turing engine + cognitive + statistical reasoning, 4MB, deterministic, offline"*
4. Visibilidade: **Public** (pra demo funcionar) ou **Private** (se quiser fechado)
5. **NÃO** marque "Initialize with README" (vamos subir o nosso)
6. Clique em **Create repository**

---

## 📤 Passo 2 — Subir os arquivos

### Opção A — Pelo terminal (recomendado)

```bash
# Extrair o ZIP em alguma pasta
cd ~/Desktop  # ou outro lugar
unzip arch-neural-v15.zip
cd arch-neural-v15

# Inicializar git
git init
git add .
git commit -m "ARCH-NEURAL V15.1 FINAL — initial commit"

# Conectar ao GitHub
git branch -M main
git remote add origin https://github.com/douglascorreacavasso/arch-neural-cortex-v15.git
git push -u origin main
```

### Opção B — Pela interface web

1. No repositório recém-criado, clique em **uploading an existing file**
2. Arraste TODOS os arquivos do ZIP descompactado
3. Commit message: `ARCH-NEURAL V15.1 FINAL — initial commit`
4. Commit changes

---

## 🌐 Passo 3 — Ativar GitHub Pages (demo online)

1. No repositório, clique em **Settings** (canto superior direito)
2. Menu lateral esquerdo, clique em **Pages**
3. Em **Source**, selecione:
   - Branch: **main**
   - Folder: **/ (root)**
4. Clique em **Save**
5. Aguarde 1-2 minutos
6. Sua demo estará em: **`https://douglascorreacavasso.github.io/arch-neural-cortex-v15/`**

---

## 🎨 Passo 4 — Personalizar o repositório

### Adicionar tópicos (tags)
Na página principal do repo, clique no ⚙️ ao lado de "About" e adicione:
```
cognitive-architecture, turing-machine, ai, javascript, deterministic-ai,
bayesian, monte-carlo, no-llm, offline-ai, statistical-reasoning,
single-file, brain, douglas-cavasso
```

### Adicionar descrição e website
- **Description:** Cérebro cognitivo modular em JavaScript — Turing + Cognitive + Statistical, 4MB, deterministic, offline
- **Website:** `https://douglascorreacavasso.github.io/arch-neural-cortex-v15/`

### Sociais (opcional)
Settings → Social Preview → upload uma imagem com:
- Logo/screenshot da interface
- Texto: "ARCH-NEURAL V15.1 — Douglas Corrêa Cavasso"

---

## 📋 Passo 5 — Validação pós-publicação

Confira que tudo está OK:

- [ ] Repositório acessível em `github.com/douglascorreacavasso/arch-neural-cortex-v15`
- [ ] README aparece formatado na home
- [ ] LICENSE detectada como "Proprietária" ou "Other"
- [ ] Demo carrega em `douglascorreacavasso.github.io/arch-neural-cortex-v15/`
- [ ] `index.html` abre no desktop
- [ ] `mobile.html` abre no celular
- [ ] As 4 baterias rodam via `node baterias/bateria_*.js`

---

## 🔄 Como atualizar futuramente

Quando quiser publicar uma nova versão (V16, V17...):

```bash
cd arch-neural-cortex-v15
# faça suas mudanças nos arquivos
git add .
git commit -m "V16 — descrição da mudança"
git push
```

O GitHub Pages atualiza automaticamente em 1-2 minutos.

---

## 📊 Passo 6 — Métricas e visibilidade

Pra acompanhar quem está usando:

1. **Stars/Forks** — visíveis na home do repo
2. **Traffic** — Settings → Insights → Traffic (mostra views diárias)
3. **Clones** — mesma página, mostra quem clonou

---

## 🔐 Passo 7 — Proteger seu trabalho

Como a licença é proprietária, considere:

### Marcar trabalho como propriedade
- Header em todos os arquivos JS com copyright (já está)
- LICENSE clara na raiz (já está)
- README com seu nome em destaque (já está)

### Monitorar uso indevido
- Use [grep.app](https://grep.app/) ou GitHub Search pra ver se alguém copiou trechos
- Configure Google Alerts pro nome "ARCH-NEURAL" + "Douglas Corrêa Cavasso"

### Em caso de uso indevido
- DMCA Takedown via GitHub (Settings → reportar repo infrator)
- Contato direto antes de medidas legais

---

## 💼 Vinculação ao seu portfólio

Adicionar ao perfil GitHub:
1. Vá em `github.com/douglascorreacavasso`
2. Edit profile
3. Em "Pinned" — pin esse repo
4. Adicione na bio: *"Criador do ARCH-NEURAL — arquitetura cognitiva determinística"*

Adicionar ao LinkedIn:
- Projeto: ARCH-NEURAL Cortex V15
- Link: github.com/douglascorreacavasso/arch-neural-cortex-v15
- Descrição: copiar do README

Adicionar ao currículo:
- Categoria: "Pesquisa/Projetos pessoais"
- Stack: JavaScript, arquitetura cognitiva, sistemas determinísticos
- Resultado: 567/567 testes (100%), 4MB single-file, browser-runnable

---

## 🆘 Problemas comuns

### Demo não carrega no GitHub Pages
- Aguarde 5 minutos após Save
- Verifique se branch=main e folder=/ (root)
- Veja em Actions se houve erro de build

### Push rejeitado
- Configure git: `git config --global user.email "douglas.cavasso@gmail.com"`
- Configure git: `git config --global user.name "Douglas Corrêa Cavasso"`
- Use token pessoal em vez de senha: github.com → Settings → Developer settings → Personal access tokens

### Arquivo arch_neural_v15_final.js muito grande
- 4MB é OK pro GitHub (limite é 100MB)
- Se passar de 100MB no futuro, usar Git LFS

---

## ✅ Checklist final

Antes de divulgar:

- [ ] Demo online funciona
- [ ] README.md leitura completa OK
- [ ] APLICACOES.md mostra casos de uso
- [ ] LICENSE clara e proprietária
- [ ] Contato (email) visível no README
- [ ] Tags do repositório adicionadas
- [ ] Description e website preenchidos
- [ ] Mobile.html testado em celular real
- [ ] Pelo menos 1 bateria rodada com sucesso

---

**Pronto!** Seu projeto está publicado e protegido.

📧 Dúvidas: douglas.cavasso@gmail.com

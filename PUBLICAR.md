# 🚀 Como publicar no GitHub

Passo-a-passo pra subir o projeto e ativar a demo online com **detecção automática mobile/desktop**.

---

## 📦 Passo 1 — Criar o repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Repository name: **`LAB_Arch-Neural-v15`** (ou `arch-neural-cortex-v15`)
3. Description: *"Cérebro cognitivo modular em JS — Turing engine + cognitive + statistical, 4MB single-file, deterministic, offline, mobile-responsive"*
4. Visibilidade: **Public** (pra demo funcionar) ou Private (se quiser fechado)
5. **NÃO** marque "Initialize with README"
6. **License:** None (deixar a proprietária do ZIP)
7. **Git ignore:** Node
8. Clique em **Create repository**

---

## 📤 Passo 2 — Subir os arquivos

### Pela GitHub Desktop (recomendado)

1. Abre o GitHub Desktop
2. **File → Add Local Repository** → escolhe a pasta `lab_V15_FINAL`
3. Vai pedir pra commitar tudo → coloca mensagem `"V15.1 FINAL — initial commit"`
4. **Publish repository** (desmarca "Keep this code private" se quiser público)

### Pelo terminal

```bash
cd lab_V15_FINAL
git init
git add .
git commit -m "V15.1 FINAL — initial commit"
git branch -M main
git remote add origin https://github.com/douglascorreacavasso/LAB_Arch-Neural-v15.git
git push -u origin main
```

---

## 🌐 Passo 3 — Ativar GitHub Pages (demo online)

1. No repositório, vai em **Settings**
2. Menu lateral esquerdo: **Pages**
3. Source: Branch **main**, Folder **/ (root)**
4. **Save**
5. Aguarda 1-2 minutos
6. Demo estará em: `https://douglascorreacavasso.github.io/LAB_Arch-Neural-v15/`

### ✨ Detecção automática mobile/desktop

A demo funciona em **qualquer dispositivo**:
- 💻 Abre no PC → carrega `index.html` (UI completa com cérebro 3D)
- 📱 Abre no celular → redireciona automaticamente pra `mobile.html` (UI touch-friendly)

**Não precisa fazer nada extra** — o `index.html` já tem o script de detecção no topo.

---

## 🎨 Passo 4 — Personalizar repositório

### Adicionar tópicos (tags)
Clica no ⚙️ ao lado de "About" e adiciona:
```
cognitive-architecture, ai, javascript, deterministic-ai, bayesian,
monte-carlo, no-llm, offline-ai, single-file, mobile-responsive,
brain-inspired, douglas-cavasso
```

### Description e website
- **Description:** Cérebro cognitivo modular em JS, 4MB, deterministic, offline, mobile-responsive
- **Website:** `https://douglascorreacavasso.github.io/LAB_Arch-Neural-v15/`

---

## 📱 Passo 5 — Testar no celular

Após publicar:
1. Abre no celular: `https://douglascorreacavasso.github.io/LAB_Arch-Neural-v15/`
2. Deve redirecionar pra `mobile.html` automaticamente
3. Testa:
   - ☰ menu hambúrguer
   - 🎨 paletas (geral + cérebro)
   - F / L / ↻ botões 3D
   - 🕸️ 🚨 UT 🧠 🔧 ⭐ 🎯 🧪 ícones laterais
   - Legenda anatômica flutuante (clica pra recolher)
   - Chat com barra de arrastar

---

## 🔄 Como atualizar versões futuras

```bash
cd lab_V15_FINAL
# faça suas mudanças
git add .
git commit -m "V16 — descrição"
git push
```

GitHub Pages atualiza automaticamente em 1-2 minutos.

---

## ✅ Checklist final

- [ ] Repositório acessível
- [ ] README renderiza certo
- [ ] LICENSE proprietária presente
- [ ] Demo carrega no `index.html`
- [ ] Demo no celular redireciona pra `mobile.html`
- [ ] Paletas funcionam (geral + cérebro)
- [ ] Botões 3D (F/L/↻) funcionam
- [ ] Painéis laterais abrem (🕸️🚨UT🧠🔧⭐🎯🧪)
- [ ] Chat funciona (envia/recebe)
- [ ] Baterias rodam: `node baterias/bateria_nivel_deus.js`

---

📧 Dúvidas: douglas.cavasso@gmail.com

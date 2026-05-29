# 🚀 Como publicar no GitHub

Passo-a-passo pra subir o projeto e ativar a demo online com **detecção automática mobile/desktop**.

---

## 📦 Passo 1 — Criar o repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Repository name: **`arch-neural-v15`** (ou similar)
3. Description: *"Cérebro cognitivo modular em JS — Turing engine + cognitive + statistical, 4MB single-file, deterministic, offline, mobile-responsive"*
4. Visibilidade: **Public** (pra demo funcionar) ou Private
5. **NÃO** marque "Initialize with README"
6. **License:** None (deixar a proprietária do ZIP)
7. **Git ignore:** Node
8. Clique em **Create repository**

---

## 📤 Passo 2 — Subir os arquivos

### Pela GitHub Desktop (recomendado)

1. Abre o GitHub Desktop
2. **File → Add Local Repository** → escolhe a pasta `arch-neural-v15`
3. Vai pedir pra commitar tudo → mensagem `"V15.1 — initial commit"`
4. **Publish repository**

### Pelo terminal

```bash
cd arch-neural-v15
git init
git add .
git commit -m "V15.1 — initial commit"
git branch -M main
git remote add origin https://github.com/SEU-USER/arch-neural-v15.git
git push -u origin main
```

---

## 🌐 Passo 3 — Ativar GitHub Pages

1. No repositório, **Settings** → **Pages**
2. Source: Branch **main**, Folder **/ (root)** → **Save**
3. Aguarda 1-2 minutos
4. Demo estará em: `https://SEU-USER.github.io/arch-neural-v15/`

### ✨ Detecção automática mobile/desktop

A demo funciona em **qualquer dispositivo**:
- 💻 Abre no PC → carrega `index.html` (UI completa)
- 📱 Abre no celular → redireciona automaticamente pra `mobile.html`

---

## 🎨 Passo 4 — Personalizar repositório

### Tópicos (tags)
```
cognitive-architecture, ai, javascript, deterministic-ai, bayesian,
monte-carlo, no-llm, offline-ai, single-file, mobile-responsive
```

### Description e website
- **Description:** Cérebro cognitivo modular em JS, 4MB, deterministic, offline
- **Website:** `https://SEU-USER.github.io/arch-neural-v15/`

---

## 📱 Passo 5 — Testar no celular

1. Abre no celular: `https://SEU-USER.github.io/arch-neural-v15/`
2. Deve redirecionar pra `mobile.html` automaticamente
3. Testa:
   - ☰ menu hambúrguer
   - 🎨 / 🧠 paletas
   - ⚛ formato (13 estilos) · ⛓ conexão (22 tipos)
   - ❓ / ❗ tutoriais
   - F / L / ↻ botões 3D
   - 🕸️ 🚨 UT 🧠 🔧 ⭐ 🎯 🧪 painéis laterais

---

## 🔄 Como atualizar versões futuras

```bash
cd arch-neural-v15
# fazer mudanças
git add .
git commit -m "V16 — descrição"
git push
```

GitHub Pages atualiza automaticamente em 1-2 minutos.

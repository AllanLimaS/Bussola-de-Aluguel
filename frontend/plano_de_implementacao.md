# Plano de Implementação: Frontend (Interface Web)

Este documento descreve a arquitetura para a construção da interface de usuário web.

## 1. Tecnologias
- **Framework**: React (inicializado via Vite para ser leve e muito rápido)
- **Estilização**: Tailwind CSS (para um design moderno, responsivo e de fácil manutenção)
- **Mapa**: Leaflet + React-Leaflet (tecnologia open-source para mapas interativos)
- **Comunicação de API**: Axios (ou Fetch API nativo) para buscar dados do Backend Python.

## 2. Estrutura de Arquivos (Frontend)
```text
frontend/
├── src/
│   ├── App.jsx             # Componente raiz (Layout principal)
│   ├── components/         # Componentes reutilizáveis
│   │   ├── MapView.jsx     # Componente do Mapa (Leaflet)
│   │   ├── ListView.jsx    # Componente da lista (Cards laterais)
│   │   └── Card.jsx        # Card individual do apartamento
│   ├── services/           # Comunicação estilo "Repository"
│   │   └── api.js          # Funções Axios que chamam a FastAPI (http://localhost:8000)
│   └── index.css           # Configurações do Tailwind CSS
├── package.json            # Dependências NPM
└── vite.config.js          # Configurações do Vite
```

## 3. Fluxo de Funcionamento (Interface)
1. O usuário acessa a página local (`http://localhost:5173`).
2. O React faz um request via Axios para `http://localhost:8000/apartments` (FastAPI).
3. A tela divide-se em duas metades (ou verticalmente em telas menores):
   - **Lado Esquerdo**: Uma lista (Cards) rolável mostrando apartamentos com foto de capa, preço e informações básicas.
   - **Lado Direito**: Um grande mapa renderizado pelo Leaflet, com  `Pins` usando a Latitude/Longitude de cada item da lista.
4. Quando o usuário clica em um Card ou um Pin, abre-se um Modal (ou expande o card) exibindo o Histórico de Preços daquele imóvel.

## 4. Passos de Implementação
- [ ] **Passo 1:** Inicializar o projeto (`npm create vite@latest . -- --template react`).
- [ ] **Passo 2:** Instalar as permissões e o Tailwind CSS.
- [ ] **Passo 3:** Instalar o Leaflet e o Axios (`npm install react-leaflet leaflet axios`).
- [ ] **Passo 4:** Criar a estrutura estática do `MapView` com coordenadas falsas só para testes (Mock).
- [ ] **Passo 5:** Criar a estrutura do `ListView` também com dados falsos.
- [ ] **Passo 6:** Integrar com o Back-end: Editar `api.js` para buscar os dados reais em JSON, substituir os Mocks e ver a tela ganhar vida.

## 5. Validação
Rodando `npm run dev`, a aplicação deve abrir no navegador, exibir o mapa com as bolinhas (Pins) corretas e a lista lateral renderizando as informações do banco esteticamente agradáveis usando TailwindCSS.
